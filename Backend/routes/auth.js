// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM fe_users WHERE email = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const permissionsResult = await db.query(`
      SELECT p.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1
    `, [user.uid]);
    const rolesResult = await db.query(`
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.uid]);
    const token = jwt.sign(
      { uid: user.uid, roles: rolesResult.rows.map(row => row.name), permissions: permissionsResult.rows.map(row => row.name) },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, first_name, last_name } = req.body;
  try {
    if (!username || !password || !first_name || !last_name) {
      return res.status(400).json({ message: 'Username, password, first_name, and last_name are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const check = await db.query('SELECT * FROM fe_users WHERE email = $1', [username]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${first_name} ${last_name}`.trim();
    await db.query('BEGIN');
    const result = await db.query(
      'INSERT INTO fe_users (username, email, password_hash, name, first_name, last_name, status, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::INTEGER) ' +
      'ON CONFLICT (email) DO NOTHING RETURNING *',
      [username, username, hashedPassword, name, first_name, last_name, 'Active']
    );
    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'User creation failed, email may already exist' });
    }
    const user = result.rows[0];
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2 ' +
      'ON CONFLICT ON CONSTRAINT user_roles_pkey DO NOTHING',
      [user.uid, 'User']
    );
    await db.query('COMMIT');
    const token = jwt.sign(
      { uid: user.uid, roles: ['User'], permissions: ['view_clients'] },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;