// backend/routes/roles.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('./permissions');

// GET /api/roles
router.get('/', auth, checkPermission('users', 'assign_roles'), async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY name ASC');
    res.json({ data: result.rows || [] });
  } catch (err) {
    console.error('Roles GET / error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/roles/:id
router.get('/:id', auth, checkPermission('users', 'assign_roles'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Role GET /:id error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/roles
router.post('/', auth, checkPermission('users', 'assign_roles'), async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const result = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name]);
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Role POST / error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/roles/:id
router.put('/:id', auth, checkPermission('users', 'assign_roles'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'No updates provided' });
    }
    const result = await db.query('UPDATE roles SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Role PUT /:id error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/roles/:id
router.delete('/:id', auth, checkPermission('users', 'assign_roles'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error('Role DELETE /:id error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;