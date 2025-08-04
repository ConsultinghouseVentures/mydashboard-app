// backend/server.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
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

// Mount routers
app.use('/api', require('./routes/auth')); // For /api/login, /api/register
app.use('/api/profile', require('./routes/profile'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/shareholders', require('./routes/shareholders'));
app.use('/api/services', require('./routes/services'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/serviceitems', require('./routes/serviceitems'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/roles', require('./routes/roles'));

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app; // Export the app for Vercel

// Conditional listen for local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}