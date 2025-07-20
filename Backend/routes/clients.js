// backend/routes/clients.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const { checkPermission } = require('./permissions');

// GET /api/clients
router.get('/', verifyToken, checkPermission('clients', 'view'), async (req, res) => {
  try {
    console.log('Executing clients query for user:', req.user.uid);
    let query = `SELECT * FROM clients`;
    let values = [];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $1`;
      values = [req.user.uid];
    }
    const result = await db.query(query, values);
    console.log('Clients query result:', result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Clients error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:uid
router.put('/:uid', verifyToken, checkPermission('clients', 'write'), async (req, res) => {
  const uid = req.params.uid;
  const body = req.body;
  console.log('Client update attempt:', { uid, ...body });
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

    let whereClause = `WHERE uid = $${index++}`;
    values.push(uid);
    if (req.user.role.toLowerCase() !== 'admin') {
      whereClause += ` AND created_by = $${index++}`;
      values.push(req.user.uid);
    }
    const query = `UPDATE clients SET ${updates.join(', ')} ${whereClause} RETURNING *`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Client update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:uid
router.get('/:uid', verifyToken, checkPermission('clients', 'view'), async (req, res) => {
  const uid = req.params.uid;
  try {
    console.log('Fetching client detail for uid:', uid);
    let query = `SELECT * FROM clients WHERE uid = $1`;
    let values = [uid];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Client detail error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients
router.post('/', verifyToken, checkPermission('clients', 'add'), async (req, res) => {
  const { client_name, status } = req.body;
  console.log('Client create attempt:', { client_name, status });
  try {
    if (!client_name || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const query = `
      INSERT INTO clients (client_name, status, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [client_name, status, req.user.uid];
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Client create error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:uid
router.delete('/:uid', verifyToken, checkPermission('clients', 'delete'), async (req, res) => {
  const uid = req.params.uid;
  try {
    let query = `DELETE FROM clients WHERE uid = $1`;
    let values = [uid];
    if (req.user.role.toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error('Client delete error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;