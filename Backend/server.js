// server.js (or equivalent server file)

const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

console.log('DB Pool Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const result = await db.query('SELECT 1');
    console.log('Database connection test:', result.rows);
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
})();

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return res.status(400).json({ message: 'Username must be a valid email' });
    }
    const result = await db.query('SELECT * FROM fe_users WHERE username = $1', [username]);
    console.log('Query result:', result.rows);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    console.log('User data:', user);
    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ uid: user.uid, username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token:', token);
    res.json({ token, user: { uid: user.uid, username: user.username, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password, name } = req.body;
  console.log('Register attempt:', { username, name });
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return res.status(400).json({ message: 'Username must be a valid email' });
    }
    const result = await db.query('SELECT * FROM fe_users WHERE username = $1', [username]);
    if (result.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      'INSERT INTO fe_users (username, password, email, name) VALUES ($1, $2, $3, $4) RETURNING uid, username, email, name',
      [username, hashedPassword, username, name || username.split('@')[0]]
    );
    const user = newUser.rows[0];
    const token = jwt.sign({ uid: user.uid, username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token for new user:', token);
    res.json({ token, user: { uid: user.uid, username: user.username, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Verifying token:', token);
  if (!token) return res.status(401).json({ message: 'No token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    console.log('Decoded token:', decoded);
    next();
  });
};

app.get('/api/serviceitems', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT uid, title, detail_description, date_from, date_to FROM tx_mpmydashboard_domain_model_serviceitems');
    console.log('Service items query result:', result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Service items error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT uid, username, email, name, academic_title, salutation, gender, first_name, last_name, street1, street2, zip, city, state, country, phone, website, employment_start, employment_end, religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth, birth_name, citizenship, place_of_residence, bank_name, bank_code_no, bank_account_no, iban, swift_bic FROM fe_users WHERE uid = $1',
      [req.user.uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', verifyToken, async (req, res) => {
  const {
    name,
    academic_title,
    salutation,
    gender,
    first_name,
    last_name,
    street1,
    street2,
    zip,
    city,
    state,
    country,
    phone,
    website,
    employment_start,
    employment_end,
    religion,
    marital_status,
    education,
    date_of_birth,
    place_of_birth,
    country_of_birth,
    birth_name,
    citizenship,
    place_of_residence,
    bank_name,
    bank_code_no,
    bank_account_no,
    iban,
    swift_bic,
    email
  } = req.body;
  console.log('Profile update attempt:', req.body);
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (name) { updates.push(`name = $${index++}`); values.push(name); }
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Email must be a valid email' });
      }
      const emailCheck = await db.query('SELECT * FROM fe_users WHERE username = $1 AND uid != $2', [email, req.user.uid]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });
      updates.push(`username = $${index++}, email = $${index++}`);
      values.push(email, email);
    }
    if (academic_title) { updates.push(`academic_title = $${index++}`); values.push(academic_title); }
    if (salutation) { updates.push(`salutation = $${index++}`); values.push(salutation); }
    if (gender) { updates.push(`gender = $${index++}`); values.push(gender); }
    if (first_name) { updates.push(`first_name = $${index++}`); values.push(first_name); }
    if (last_name) { updates.push(`last_name = $${index++}`); values.push(last_name); }
    if (street1) { updates.push(`street1 = $${index++}`); values.push(street1); }
    if (street2) { updates.push(`street2 = $${index++}`); values.push(street2); }
    if (zip) { updates.push(`zip = $${index++}`); values.push(zip); }
    if (city) { updates.push(`city = $${index++}`); values.push(city); }
    if (state) { updates.push(`state = $${index++}`); values.push(state); }
    if (country) { updates.push(`country = $${index++}`); values.push(country); }
    if (phone) { updates.push(`phone = $${index++}`); values.push(phone); }
    if (website) { updates.push(`website = $${index++}`); values.push(website); }
    if (employment_start) { updates.push(`employment_start = $${index++}`); values.push(employment_start); }
    if (employment_end) { updates.push(`employment_end = $${index++}`); values.push(employment_end); }
    if (religion) { updates.push(`religion = $${index++}`); values.push(religion); }
    if (marital_status) { updates.push(`marital_status = $${index++}`); values.push(marital_status); }
    if (education) { updates.push(`education = $${index++}`); values.push(education); }
    if (date_of_birth) { updates.push(`date_of_birth = $${index++}`); values.push(date_of_birth); }
    if (place_of_birth) { updates.push(`place_of_birth = $${index++}`); values.push(place_of_birth); }
    if (country_of_birth) { updates.push(`country_of_birth = $${index++}`); values.push(country_of_birth); }
    if (birth_name) { updates.push(`birth_name = $${index++}`); values.push(birth_name); }
    if (citizenship) { updates.push(`citizenship = $${index++}`); values.push(citizenship); }
    if (place_of_residence) { updates.push(`place_of_residence = $${index++}`); values.push(place_of_residence); }
    if (bank_name) { updates.push(`bank_name = $${index++}`); values.push(bank_name); }
    if (bank_code_no) { updates.push(`bank_code_no = $${index++}`); values.push(bank_code_no); }
    if (bank_account_no) { updates.push(`bank_account_no = $${index++}`); values.push(bank_account_no); }
    if (iban) { updates.push(`iban = $${index++}`); values.push(iban); }
    if (swift_bic) { updates.push(`swift_bic = $${index++}`); values.push(swift_bic); }

    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    values.push(req.user.uid);
    const query = `UPDATE fe_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE uid = $${index} RETURNING uid, username, email, name, academic_title, salutation, gender, first_name, last_name, street1, street2, zip, city, state, country, phone, website, employment_start, employment_end, religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth, birth_name, citizenship, place_of_residence, bank_name, bank_code_no, bank_account_no, iban, swift_bic, updated_at`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = result.rows[0];
    const token = jwt.sign({ uid: user.uid, username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ ...user, token });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/change-password', verifyToken, async (req, res) => {
  const { password } = req.body;
  console.log('Password change attempt for user:', req.user.uid);
  try {
    if (!password) return res.status(400).json({ message: 'Password is required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'UPDATE fe_users SET password = $1 WHERE uid = $2 RETURNING uid, username, email, name',
      [hashedPassword, req.user.uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = result.rows[0];
    const token = jwt.sign({ uid: user.uid, username: user.username, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ ...user, token });
  } catch (err) {
    console.error('Password change error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients', verifyToken, async (req, res) => {
  try {
    console.log('Executing clients query for user:', req.user.uid);
    const result = await db.query(
      `SELECT c.uid, c.client_name, c.status 
       FROM clients c`,
      []
    );
    console.log('Clients query result:', result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Clients error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:uid', verifyToken, async (req, res) => {
  const uid = req.params.uid;
  const { client_name, status } = req.body;
  console.log('Client update attempt:', { uid, client_name, status });
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (client_name !== undefined) {
      updates.push(`client_name = $${index++}`);
      values.push(client_name);
    }
    if (status !== undefined) {
      updates.push(`status = $${index++}`);
      values.push(status);
    }

    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    values.push(uid);
    const query = `UPDATE clients SET ${updates.join(', ')} WHERE uid = $${index} RETURNING *`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Client update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients/:uid', verifyToken, async (req, res) => {
  const uid = req.params.uid;
  try {
    console.log('Fetching client detail for uid:', uid);
    const result = await db.query(
      `SELECT c.uid, c.client_name, c.status 
       FROM clients c 
       WHERE c.uid = $1`,
      [uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Client detail error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});