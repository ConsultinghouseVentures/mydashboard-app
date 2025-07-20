// Backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

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

module.exports = db;