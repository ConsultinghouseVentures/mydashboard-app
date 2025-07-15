const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // Temporary workaround for self-signed certificate
});

console.log('DB Pool Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

const SECRET_KEY = 'your-very-secure-secret-key'; // Replace with a strong, unique key in production

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