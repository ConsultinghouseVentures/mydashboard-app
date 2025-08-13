// backend/routes/employees.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkPermission } = require('./permissions');
const bcrypt = require('bcryptjs');

// GET /api/employees
router.get('/', auth, checkPermission('employees', 'view'), async (req, res) => {
  try {
    const { client_id } = req.query;
    let query = `
      SELECT u.*, 
             c.client_name AS client_name,
             (SELECT array_agg(r.name) FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.uid) as user_roles
      FROM fe_users u
      LEFT JOIN clients c ON u.client_id = c.uid
      WHERE 'Employee' = ANY (SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.uid)
    `;
    let values = [];
    const isAdmin = req.user.roles && req.user.roles.some(role => role.toLowerCase() === 'admin');

    if (client_id) {
      query += ` AND u.client_id = $${values.length + 1}`;
      values.push(client_id);
    }

    if (!isAdmin) {
      if (client_id && client_id !== req.user.client_id) {
        return res.status(403).json({ message: 'Unauthorized to view employees of this client' });
      }
      if (!client_id) {
        query += ` AND u.client_id = $${values.length + 1}`;
        values.push(req.user.client_id);
      }
    }

    const result = await db.query(query, values);
    res.json({ data: result.rows || [] });
  } catch (err) {
    console.error('Employees error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/employees/:uid
router.get('/:uid', auth, checkPermission('employees', 'view'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `
      SELECT u.*, 
             c.client_name AS client_name,
             (SELECT array_agg(r.name) FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = u.uid) as user_roles
      FROM fe_users u
      LEFT JOIN clients c ON u.client_id = c.uid
      WHERE u.uid = $1
    `;
    let values = [uid];
    const isAdmin = req.user.roles && req.user.roles.some(role => role.toLowerCase() === 'admin');

    if (!isAdmin) {
      query += ` AND u.client_id = $2`;
      values.push(req.user.client_id);
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Employee detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/employees
router.post('/', auth, checkPermission('employees', 'add'), async (req, res) => {
  let { username, password, email, name, first_name, last_name, phone, website, employment_start, client_id, role } = req.body;
  try {
    const isAdmin = req.user.roles && req.user.roles.some(role => role.toLowerCase() === 'admin');
    if (!isAdmin && client_id !== req.user.client_id) {
      return res.status(403).json({ message: 'Unauthorized to add employee to this client' });
    }

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
    console.error('Employee create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/employees/:uid
router.put('/:uid', auth, checkPermission('employees', 'edit'), async (req, res) => {
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

    const isAdmin = req.user.roles && req.user.roles.some(role => role.toLowerCase() === 'admin');
    if (!isAdmin) {
      query += ` AND client_id = $${index++}`;
      values.push(req.user.client_id);
    }

    query += ` RETURNING *`;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Employee update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/employees/:uid
router.delete('/:uid', auth, checkPermission('employees', 'delete'), async (req, res) => {
  const { uid } = req.params;
  try {
    let query = `DELETE FROM fe_users WHERE uid = $1`;
    let values = [uid];
    const isAdmin = req.user.roles && req.user.roles.some(role => role.toLowerCase() === 'admin');
    if (!isAdmin) {
      query += ` AND client_id = $2`;
      values.push(req.user.client_id);
    }
    const result = await db.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Employee delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;