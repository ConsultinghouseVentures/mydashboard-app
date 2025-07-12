const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();

app.use(express.json());

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: true },
});

app.listen(3001, () => console.log('Server running on port 3001'));