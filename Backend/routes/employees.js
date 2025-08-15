// Path: backend/routes/employees.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { checkPermission } = require('./permissions');
const auth = require('../middleware/auth');

// GET /api/employees - Fetch all employees with roles and client names
router.get('/', auth, checkPermission('employees', 'view'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.uid, u.username, u.email, u.created_at, u.updated_at, u.status, 
             COALESCE(u.role, r.name, '') as role, u.first_name, u.last_name, u.name,
             u.academic_title, u.salutation, u.gender, u.phone, u.website,
             u.employment_start, u.employment_end, u.religion, u.marital_status,
             u.education, u.date_of_birth, u.place_of_birth, u.country_of_birth,
             u.birth_name, u.citizenship, u.place_of_residence, u.street1,
             u.street2, u.zip, u.city, u.state, u.country, u.bank_name,
             u.bank_code_no, u.bank_account_no, u.iban, u.swift_bic, u.client_id,
             c.client_name
      FROM fe_users u
      LEFT JOIN user_roles ur ON u.uid = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN clients c ON u.client_id = c.uid
    `);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Employees GET / error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/employees/:uid - Fetch a single employee
router.get('/:uid', auth, checkPermission('employees', 'view'), async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await db.query(`
      SELECT u.uid, u.username, u.email, u.created_at, u.updated_at, u.status, 
             COALESCE(u.role, r.name, '') as role, u.first_name, u.last_name, u.name,
             u.academic_title, u.salutation, u.gender, u.phone, u.website,
             u.employment_start, u.employment_end, u.religion, u.marital_status,
             u.education, u.date_of_birth, u.place_of_birth, u.country_of_birth,
             u.birth_name, u.citizenship, u.place_of_residence, u.street1,
             u.street2, u.zip, u.city, u.state, u.country, u.bank_name,
             u.bank_code_no, u.bank_account_no, u.iban, u.swift_bic, u.client_id,
             c.client_name
      FROM fe_users u
      LEFT JOIN user_roles ur ON u.uid = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN clients c ON u.client_id = c.uid
      WHERE u.uid = $1
    `, [uid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Employee GET /:uid error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/employees - Create a new employee
router.post('/', auth, checkPermission('employees', 'add'), async (req, res) => {
  const { first_name, last_name, email, password, status, role, client_id } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const password_hash = await bcrypt.hash(password, 10);
    const roleToSet = role && ['Admin', 'User', 'Employee'].includes(role) ? role : null;
    const result = await client.query(
      'INSERT INTO fe_users (username, email, password_hash, first_name, last_name, status, role, client_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, client_id',
      [email, email, password_hash, first_name, last_name, status, roleToSet, client_id || null, Math.floor(Date.now() / 1000)]
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
    console.error('Add employee error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/employees/:uid - Update an employee
router.put('/:uid', auth, checkPermission('employees', 'edit'), async (req, res) => {
  const { uid } = req.params;
  const {
    first_name,
    last_name,
    email,
    status,
    role,
    client_id,
    name,
    academic_title,
    salutation,
    gender,
    phone,
    website,
    employment_start,
    employment_end,
    religion,
    marital_status,
    education,
    date_of_birth,
    place_of_birth,
    country_of_birth,
    birth_name,
    citizenship,
    place_of_residence,
    street1,
    street2,
    zip,
    city,
    state,
    country,
    bank_name,
    bank_code_no,
    bank_account_no,
    iban,
    swift_bic,
  } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const roleToSet = role && ['Admin', 'User', 'Employee'].includes(role) ? role : null;
    const result = await client.query(
      `UPDATE fe_users SET 
        first_name = $1, last_name = $2, email = $3, status = $4, role = $5, client_id = $6, name = $7, 
        academic_title = $8, salutation = $9, gender = $10, phone = $11, website = $12, 
        employment_start = $13, employment_end = $14, religion = $15, marital_status = $16, 
        education = $17, date_of_birth = $18, place_of_birth = $19, country_of_birth = $20, 
        birth_name = $21, citizenship = $22, place_of_residence = $23, street1 = $24, 
        street2 = $25, zip = $26, city = $27, state = $28, country = $29, bank_name = $30, 
        bank_code_no = $31, bank_account_no = $32, iban = $33, swift_bic = $34, updated_at = $35 
        WHERE uid = $36 
        RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, client_id, name,
                  academic_title, salutation, gender, phone, website, employment_start, employment_end,
                  religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth,
                  birth_name, citizenship, place_of_residence, street1, street2, zip, city, state, country,
                  bank_name, bank_code_no, bank_account_no, iban, swift_bic`,
      [
        first_name || null,
        last_name || null,
        email,
        status,
        roleToSet,
        client_id || null,
        name || null,
        academic_title || null,
        salutation || null,
        gender || null,
        phone || null,
        website || null,
        employment_start || null,
        employment_end || null,
        religion || null,
        marital_status || null,
        education || null,
        date_of_birth || null,
        place_of_birth || null,
        country_of_birth || null,
        birth_name || null,
        citizenship || null,
        place_of_residence || null,
        street1 || null,
        street2 || null,
        zip || null,
        city || null,
        state || null,
        country || null,
        bank_name || null,
        bank_code_no || null,
        bank_account_no || null,
        iban || null,
        swift_bic || null,
        new Date().toISOString(),
        uid,
      ]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found' });
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
    console.error('Update employee error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/employees/:uid - Delete an employee
router.delete('/:uid', auth, checkPermission('employees', 'delete'), async (req, res) => {
  const { uid } = req.params;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [uid]);
    const result = await client.query('DELETE FROM fe_users WHERE uid = $1', [uid]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Employee not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete employee error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;