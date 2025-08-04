// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { checkPermission } = require('./permissions');
const auth = require('../middleware/auth');

// GET /api/users - Fetch all users with roles from fe_users and user_roles
router.get('/', auth, checkPermission('users', 'view'), async (req, res) => {
  const result = await db.query(`
    SELECT u.uid, u.username, u.email, u.created_at, u.updated_at, u.status, 
           COALESCE(u.role, r.name, '') as role, u.first_name, u.last_name, u.name,
           u.academic_title, u.salutation, u.gender, u.phone, u.website,
           u.employment_start, u.employment_end, u.religion, u.marital_status,
           u.education, u.date_of_birth, u.place_of_birth, u.country_of_birth,
           u.birth_name, u.citizenship, u.place_of_residence, u.street1,
           u.street2, u.zip, u.city, u.state, u.country, u.bank_name,
           u.bank_code_no, u.bank_account_no, u.iban, u.swift_bic
    FROM fe_users u
    LEFT JOIN user_roles ur ON u.uid = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
  `);
  res.json({ data: result.rows });
});

// GET /api/users/:uid - Fetch a single user
router.get('/:uid', auth, checkPermission('users', 'view'), async (req, res) => {
  const { uid } = req.params;
  const result = await db.query(`
    SELECT u.uid, u.username, u.email, u.created_at, u.updated_at, u.status, 
           COALESCE(u.role, r.name, '') as role, u.first_name, u.last_name, u.name,
           u.academic_title, u.salutation, u.gender, u.phone, u.website,
           u.employment_start, u.employment_end, u.religion, u.marital_status,
           u.education, u.date_of_birth, u.place_of_birth, u.country_of_birth,
           u.birth_name, u.citizenship, u.place_of_residence, u.street1,
           u.street2, u.zip, u.city, u.state, u.country, u.bank_name,
           u.bank_code_no, u.bank_account_no, u.iban, u.swift_bic
    FROM fe_users u
    LEFT JOIN user_roles ur ON u.uid = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.uid = $1
  `, [uid]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ data: result.rows[0] });
});

// POST /api/users - Create a new user
router.post('/', auth, checkPermission('users', 'add'), async (req, res) => {
  const { first_name, last_name, email, password, status, role, name } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const password_hash = await bcrypt.hash(password, 10);
    const roleToSet = role && ['Admin', 'User', 'Employee'].includes(role) ? role : null;
    const result = await client.query(
      'INSERT INTO fe_users (username, email, password_hash, first_name, last_name, status, role, name, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, name',
      [email, email, password_hash, first_name, last_name, status, roleToSet, name, Math.floor(Date.now() / 1000)]
    );
    if (roleToSet) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [roleToSet]);
      if (roleResult.rows.length > 0) {
        await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [result.rows[0].uid, roleResult.rows[0].id]);
      }
    }
    await client.query('COMMIT');
    res.json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/users/:uid - Update a user
router.put('/:uid', auth, checkPermission('users', 'edit'), async (req, res) => {
  const { uid } = req.params;
  const { first_name, last_name, email, status, role, name, academic_title, salutation, gender, phone, website, employment_start, employment_end, religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth, birth_name, citizenship, place_of_residence, street1, street2, zip, city, state, country, bank_name, bank_code_no, bank_account_no, iban, swift_bic } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const roleToSet = role && ['Admin', 'User', 'Employee'].includes(role) ? role : null;
    const result = await client.query(
      `UPDATE fe_users SET 
        first_name = $1, last_name = $2, email = $3, status = $4, role = $5, name = $6, 
        academic_title = $7, salutation = $8, gender = $9, phone = $10, website = $11, 
        employment_start = $12, employment_end = $13, religion = $14, marital_status = $15, 
        education = $16, date_of_birth = $17, place_of_birth = $18, country_of_birth = $19, 
        birth_name = $20, citizenship = $21, place_of_residence = $22, street1 = $23, 
        street2 = $24, zip = $25, city = $26, state = $27, country = $28, bank_name = $29, 
        bank_code_no = $30, bank_account_no = $31, iban = $32, swift_bic = $33, updated_at = $34 
        WHERE uid = $35 
        RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, name,
                  academic_title, salutation, gender, phone, website, employment_start, employment_end,
                  religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth,
                  birth_name, citizenship, place_of_residence, street1, street2, zip, city, state, country,
                  bank_name, bank_code_no, bank_account_no, iban, swift_bic`,
      [first_name || null, last_name || null, email, status, roleToSet, name || null, academic_title || null, salutation || null, gender || null, phone || null, website || null, employment_start || null, employment_end || null, religion || null, marital_status || null, education || null, date_of_birth || null, place_of_birth || null, country_of_birth || null, birth_name || null, citizenship || null, place_of_residence || null, street1 || null, street2 || null, zip || null, city || null, state || null, country || null, bank_name || null, bank_code_no || null, bank_account_no || null, iban || null, swift_bic || null, new Date().toISOString(), uid]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [uid]);
    if (roleToSet) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [roleToSet]);
      if (roleResult.rows.length > 0) {
        await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [uid, roleResult.rows[0].id]);
      }
    }
    await client.query('COMMIT');
    res.json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/users/:uid/password - Update user password
router.put('/:uid/password', auth, checkPermission('users', 'edit'), async (req, res) => {
  const { uid } = req.params;
  const { password } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const password_hash = await bcrypt.hash(password, 10);
    const result = await client.query(
      'UPDATE fe_users SET password_hash = $1, updated_at = $2 WHERE uid = $3 RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, name',
      [password_hash, new Date().toISOString(), uid]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }
    await client.query('COMMIT');
    res.json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/users/:uid - Delete a user
router.delete('/:uid', auth, checkPermission('users', 'delete'), async (req, res) => {
  const { uid } = req.params;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [uid]);
    const result = await client.query('DELETE FROM fe_users WHERE uid = $1', [uid]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'User deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;