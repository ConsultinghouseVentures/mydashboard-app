// backend/routes/shareholders.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('./permissions');
const bcrypt = require('bcryptjs');

// GET /api/shareholders
router.get('/', auth, checkPermission('clients', 'view'), async (req, res) => {
  try {
    const { client_id } = req.query;
    let query = `
      SELECT u.*, 
             (SELECT array_agg(r.name) FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.uid) as user_roles
      FROM fe_users u
    `;
    let values = [];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';

    if (!isAdmin) {
      query += ` JOIN clients c ON u.client_id = c.uid`;
    }

    if (client_id) {
      if (values.length === 0) {
        query += ` WHERE`;
      } else {
        query += ` AND`;
      }
      query += ` u.client_id = $${values.length + 1}`;
      values.push(client_id);
    }

    if (!isAdmin) {
      if (values.length === 0) {
        query += ` WHERE`;
      } else {
        query += ` AND`;
      }
      query += ` c.created_by = $${values.length + 1}`;
      values.push(req.user.uid);
    }

    const result = await db.query(query, values);
    res.json({ data: result.rows || [] });
  } catch (err) {
    console.error('Shareholders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shareholders/:uid
router.get('/:uid', auth, checkPermission('clients', 'view'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `
      SELECT u.*, 
             (SELECT array_agg(r.name) FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.uid) as user_roles
      FROM fe_users u
      WHERE u.uid = $1
    `;
    let values = [uid];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';

    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = u.client_id AND c.created_by = $2)`;
      values.push(req.user.uid);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Shareholder not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Shareholder detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shareholders
router.post('/', auth, checkPermission('clients', 'edit'), async (req, res) => {
  let { username, password, email, name, first_name, last_name, phone, website, employment_start, client_id, role } = req.body;
  try {
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO fe_users (username, password_hash, email, name, first_name, last_name, phone, website, employment_start, client_id, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Active', $11)
      RETURNING *
    `;
    const values = [username, password_hash, email, name, first_name, last_name, phone, website, employment_start, client_id, req.user.uid];
    const result = await db.query(query, values);
    const newUser = result.rows[0];

    if (role) {
      const roleQuery = `SELECT id FROM roles WHERE name = $1`;
      const roleResult = await db.query(roleQuery, [role]);
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await db.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [newUser.uid, roleId]);
      }
    }

    res.json({ data: newUser });
  } catch (err) {
    console.error('Shareholder create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/shareholders/:uid
router.put('/:uid', auth, checkPermission('clients', 'edit'), async (req, res) => {
  const { uid } = req.params;
  const body = req.body;
  try {
    const updates = [];
    const values = [];
    let index = 1;

    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && key !== 'uid' && key !== 'created_by' && key !== 'password_hash') {
        updates.push(`${key} = $${index++}`);
        values.push(body[key]);
      }
    });

    if (body.password) {
      const password_hash = await bcrypt.hash(body.password, 10);
      updates.push(`password_hash = $${index++}`);
      values.push(password_hash);
    }

    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    let query = `UPDATE fe_users SET ${updates.join(', ')} WHERE uid = $${index++}`;
    values.push(uid);

    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';
    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = client_id AND c.created_by = $${index++})`;
      values.push(req.user.uid);
    }

    query += ` RETURNING *`;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Shareholder not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Shareholder update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/shareholders/:uid
router.delete('/:uid', auth, checkPermission('clients', 'delete'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `DELETE FROM fe_users WHERE uid = $1`;
    let values = [uid];
    let isAdmin = req.user.roles && req.user.roles[0] && req.user.roles[0].toLowerCase() === 'admin';
    if (!isAdmin) {
      query += ` AND EXISTS (SELECT 1 FROM clients c WHERE c.uid = client_id AND c.created_by = $2)`;
      values.push(req.user.uid);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Shareholder not found' });
    res.json({ message: 'Shareholder deleted' });
  } catch (err) {
    console.error('Shareholder delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;