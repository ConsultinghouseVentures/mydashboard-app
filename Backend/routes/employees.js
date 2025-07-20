// backend/routes/employees.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const { checkPermission } = require('./permissions');

// GET /api/employees
router.get('/', verifyToken, checkPermission('employees', 'view'), async (req, res) => {
  try {
    console.log('Executing employees query for user:', req.user.uid);
    let query = `SELECT * FROM users WHERE role = 'Employee'`;
    let values = [];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $1`;
      values = [req.user.uid];
    }
    const result = await db.query(query, values);
    console.log('Employees query result:', result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Employees error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/employees/:uid
router.put('/:uid', verifyToken, checkPermission('employees', 'write'), async (req, res) => {
  const uid = req.params.uid;
  const body = req.body;
  console.log('Employee update attempt:', { uid, ...body });
  try {
    const updates = [];
    const values = [];
    let index = 1;

    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && key !== 'uid' && key !== 'created_by') {
        updates.push(`${key} = $${index++}`);
        values.push(body[key]);
      }
    });

    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    let whereClause = `WHERE uid = $${index++} AND role = 'Employee'`;
    values.push(uid);
    if (req.user.role.toLowerCase() !== 'admin') {
      whereClause += ` AND created_by = $${index++}`;
      values.push(req.user.uid);
    }
    const query = `UPDATE users SET ${updates.join(', ')} ${whereClause} RETURNING *`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Employee update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/employees/:uid
router.get('/:uid', verifyToken, checkPermission('employees', 'view'), async (req, res) => {
  const uid = req.params.uid;
  try {
    console.log('Fetching employee detail for uid:', uid);
    let query = `SELECT * FROM users WHERE uid = $1 AND role = 'Employee'`;
    let values = [uid];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Employee detail error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/employees
router.post('/', verifyToken, checkPermission('employees', 'add'), async (req, res) => {
  const { first_name, last_name, email, password, status, client_id } = req.body;
  console.log('Employee create attempt:', { first_name, last_name, email, status, client_id });
  try {
    if (!first_name || !last_name || !email || !password || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const query = `
      INSERT INTO users (first_name, last_name, email, password, status, role, created_by, client_id)
      VALUES ($1, $2, $3, $4, $5, 'Employee', $6, $7)
      RETURNING *
    `;
    const values = [first_name, last_name, email, password, status, req.user.uid, client_id || null];
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Employee create error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/employees/:uid
router.delete('/:uid', verifyToken, checkPermission('employees', 'delete'), async (req, res) => {
  const uid = req.params.uid;
  try {
    let query = `DELETE FROM users WHERE uid = $1 AND role = 'Employee'`;
    let values = [uid];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Employee delete error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;