// backend/routes/invoices.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('./permissions');

// GET /api/invoices
router.get('/', auth, checkPermission('clients', 'view'), async (req, res) => {
  try {
    const { client_id } = req.query;
    let query = `SELECT * FROM invoices`;
    let values = [];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';

    if (!isAdmin) {
      query += ` JOIN clients c ON invoices.client_id = c.uid`;
    }

    if (client_id) {
      query += ` WHERE invoices.client_id = $${values.length + 1}`;
      values.push(client_id);
    }

    if (!isAdmin) {
      if (client_id) {
        query += ` AND`;
      } else {
        query += ` WHERE`;
      }
      query += ` c.created_by = $${values.length + 1}`;
      values.push(req.user.uid);
    }

    const result = await db.query(query, values);
    res.json({ data: result.rows || [] });
  } catch (err) {
    console.error('Invoices GET / error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:uid
router.get('/:uid', auth, checkPermission('clients', 'view'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `SELECT * FROM invoices WHERE uid = $1`;
    let values = [uid];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';

    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = client_id AND c.created_by = $2)`;
      values.push(req.user.uid);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Invoices GET /:uid error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', auth, checkPermission('clients', 'edit'), async (req, res) => {
  const { client_id, invoice_no, date, issuer, total, paid, open, status } = req.body;
  try {
    if (!client_id || !invoice_no) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const query = `
      INSERT INTO invoices (client_id, invoice_no, date, issuer, total, paid, open, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [client_id, invoice_no, date, issuer, total, paid, open, status || 'Pending', req.user.uid];
    const result = await db.query(query, values);
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Invoices POST / error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/invoices/:uid
router.put('/:uid', auth, checkPermission('clients', 'edit'), async (req, res) => {
  const { uid } = req.params;
  const body = req.body;
  try {
    const updates = [];
    const values = [];
    let index = 1;

    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && key !== 'uid' && key !== 'created_by' && key !== 'client_id') {
        updates.push(`${key} = $${index++}`);
        values.push(body[key]);
      }
    });

    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    let query = `UPDATE invoices SET ${updates.join(', ')} WHERE uid = $${index++}`;
    values.push(uid);

    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';
    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = client_id AND c.created_by = $${index++})`;
      values.push(req.user.uid);
    }

    query += ` RETURNING *`;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Invoices PUT /:uid error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invoices/:uid
router.delete('/:uid', auth, checkPermission('clients', 'edit'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `DELETE FROM invoices WHERE uid = $1`;
    let values = [uid];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';
    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = client_id AND c.created_by = $2)`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('Invoices DELETE /:uid error:', err.stack || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;