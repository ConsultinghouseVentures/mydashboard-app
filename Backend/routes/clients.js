// backend/routes/clients.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('./permissions');

// GET /api/clients
router.get('/', auth, checkPermission('clients', 'view'), async (req, res) => {
  try {
    console.log('Executing clients query for user:', req.user.uid);
    let query = `SELECT * FROM clients`;
    let values = [];
    if (req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() !== 'admin') {
      query += ` AND created_by = $1`;
      values = [req.user.uid];
    }
    const result = await db.query(query, values);
    console.log('Clients query result:', result.rows);
    res.json({ data: result.rows || [] });
  } catch (err) {
    console.error('Clients GET / error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:uid
router.put('/:uid', auth, checkPermission('clients', 'edit'), async (req, res) => {
  const uid = req.params.uid;
  const body = req.body;
  console.log('Client update attempt:', { uid, ...body });
  try {
    const updates = [];
    const values = [];
    let index = 1;

    const dateFields = ['incorporation_date', 'creation_date', 'fiscal_year_start'];

    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && key !== 'uid' && key !== 'created_by') {
        let value = body[key];
        if (dateFields.includes(key) && (value === '' || value === null)) {
          value = null;
        }
        updates.push(`${key} = $${index++}`);
        values.push(value);
      }
    });

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 1) return res.status(400).json({ message: 'No updates provided' }); // Only updated_at, no real updates

    let whereClause = `WHERE uid = $${index++}`;
    values.push(uid);
    if (req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() !== 'admin') {
      whereClause += ` AND created_by = $${index++}`;
      values.push(req.user.uid);
    }
    const query = `UPDATE clients SET ${updates.join(', ')} ${whereClause} RETURNING *`;
    console.log('Update query:', query);
    console.log('Update values:', values);
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Client update error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:uid
router.get('/:uid', auth, checkPermission('clients', 'view'), async (req, res) => {
  const uid = req.params.uid;
  try {
    console.log('Fetching client detail for uid:', uid);
    let query = `SELECT * FROM clients WHERE uid = $1`;
    let values = [uid];
    if (req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Client detail error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients
router.post('/', auth, checkPermission('clients', 'add'), async (req, res) => {
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
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Client create error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/clients/:uid
router.delete('/:uid', auth, checkPermission('clients', 'delete'), async (req, res) => {
  const uid = req.params.uid;
  try {
    let query = `DELETE FROM clients WHERE uid = $1`;
    let values = [uid];
    if (req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() !== 'admin') {
      query += ` AND created_by = $2`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error('Client delete error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;