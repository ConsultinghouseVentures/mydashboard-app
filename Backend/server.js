const express = require('express');
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables
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
  ssl: { rejectUnauthorized: true },
});

const SECRET_KEY = 'your-secure-key'; // Replace with a strong, unique key

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM fe_users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, result.rows[0].password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ uid: result.rows[0].uid, username: result.rows[0].username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { uid: result.rows[0].uid, username: result.rows[0].username, email: result.rows[0].email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Get service items
app.get('/api/serviceitems', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT uid, title, detail_description, date_from, date_to FROM tx_mpmydashboard_domain_model_serviceitems');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));