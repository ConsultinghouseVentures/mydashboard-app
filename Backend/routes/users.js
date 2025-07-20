const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('view_users')) {
    return res.status(403).json({ message: 'Forbidden: view_users permission required' });
  }
  try {
    const result = await db.query(`
      SELECT u.uid, u.username, u.email, u.name, u.first_name, u.last_name, u.status,
             ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM fe_users u
      LEFT JOIN user_roles ur ON u.uid = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.uid, u.username, u.email, u.name, u.first_name, u.last_name, u.status
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Users list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:uid', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('view_users')) {
    return res.status(403).json({ message: 'Forbidden: view_users permission required' });
  }
  const { uid } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM fe_users WHERE uid = $1',
      [uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:uid', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('edit_users')) {
    return res.status(403).json({ message: 'Forbidden: edit_users permission required' });
  }
  const { uid } = req.params;
  const {
    name, academic_title, salutation, gender, first_name, last_name, street1, street2, zip, city, state, country,
    phone, website, employment_start, employment_end, religion, marital_status, education, date_of_birth,
    place_of_birth, country_of_birth, birth_name, citizenship, place_of_residence, bank_name, bank_code_no,
    bank_account_no, iban, swift_bic, email, status, role
  } = req.body;
  console.log('User update attempt for UID:', uid, req.body);
  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (name) { updates.push(`name = $${index++}`); values.push(name); }
    if (academic_title) { updates.push(`academic_title = $${index++}`); values.push(academic_title); }
    if (salutation) { updates.push(`salutation = $${index++}`); values.push(salutation); }
    if (gender) { updates.push(`gender = $${index++}`); values.push(gender); }
    if (first_name) { updates.push(`first_name = $${index++}`); values.push(first_name); }
    if (last_name) { updates.push(`last_name = $${index++}`); values.push(last_name); }
    if (street1) { updates.push(`street1 = $${index++}`); values.push(street1); }
    if (street2) { updates.push(`street2 = $${index++}`); values.push(street2); }
    if (zip) { updates.push(`zip = $${index++}`); values.push(zip); }
    if (city) { updates.push(`city = $${index++}`); values.push(city); }
    if (state) { updates.push(`state = $${index++}`); values.push(state); }
    if (country) { updates.push(`country = $${index++}`); values.push(country); }
    if (phone) { updates.push(`phone = $${index++}`); values.push(phone); }
    if (website) { updates.push(`website = $${index++}`); values.push(website); }
    if (employment_start) { updates.push(`employment_start = $${index++}`); values.push(employment_start); }
    if (employment_end) { updates.push(`employment_end = $${index++}`); values.push(employment_end); }
    if (religion) { updates.push(`religion = $${index++}`); values.push(religion); }
    if (marital_status) { updates.push(`marital_status = $${index++}`); values.push(marital_status); }
    if (education) { updates.push(`education = $${index++}`); values.push(education); }
    if (date_of_birth) { updates.push(`date_of_birth = $${index++}`); values.push(date_of_birth); }
    if (place_of_birth) { updates.push(`place_of_birth = $${index++}`); values.push(place_of_birth); }
    if (country_of_birth) { updates.push(`country_of_birth = $${index++}`); values.push(country_of_birth); }
    if (birth_name) { updates.push(`birth_name = $${index++}`); values.push(birth_name); }
    if (citizenship) { updates.push(`citizenship = $${index++}`); values.push(citizenship); }
    if (place_of_residence) { updates.push(`place_of_residence = $${index++}`); values.push(place_of_residence); }
    if (bank_name) { updates.push(`bank_name = $${index++}`); values.push(bank_name); }
    if (bank_code_no) { updates.push(`bank_code_no = $${index++}`); values.push(bank_code_no); }
    if (bank_account_no) { updates.push(`bank_account_no = $${index++}`); values.push(bank_account_no); }
    if (iban) { updates.push(`iban = $${index++}`); values.push(iban); }
    if (swift_bic) { updates.push(`swift_bic = $${index++}`); values.push(swift_bic); }
    if (status) { updates.push(`status = $${index++}`); values.push(status); }
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Email must be a valid email' });
      }
      const emailCheck = await db.query('SELECT * FROM fe_users WHERE email = $1 AND uid != $2', [email, uid]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });
      updates.push(`username = $${index++}, email = $${index++}`);
      values.push(email, email);
    }

    if (updates.length === 0 && !role) return res.status(400).json({ message: 'No updates provided' });

    await db.query('BEGIN');
    if (updates.length > 0) {
      values.push(uid);
      const query = `UPDATE fe_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE uid = $${index} RETURNING *`;
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'User not found' });
      }
    }
    if (role) {
      await db.query('DELETE FROM user_roles WHERE user_id = $1', [uid]);
      await db.query(
        'INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2 ' +
        'ON CONFLICT ON CONSTRAINT user_roles_pkey DO NOTHING',
        [uid, role]
      );
    }
    await db.query('COMMIT');
    const result = await db.query(`
      SELECT u.*, ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM fe_users u
      LEFT JOIN user_roles ur ON u.uid = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.uid = $1
      GROUP BY u.uid
    `, [uid]);
    res.json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('User update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:uid', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('delete_users')) {
    return res.status(403).json({ message: 'Forbidden: delete_users permission required' });
  }
  const { uid } = req.params;
  try {
    const result = await db.query('DELETE FROM fe_users WHERE uid = $1 RETURNING uid', [uid]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('User delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('add_users')) {
    return res.status(403).json({ message: 'Forbidden: add_users permission required' });
  }
  const { first_name, last_name, email, password, status, role } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const check = await db.query('SELECT * FROM fe_users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];
    await db.query('BEGIN');
    const result = await db.query(
      'INSERT INTO fe_users (username, email, password_hash, name, first_name, last_name, status, created_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::INTEGER) ' +
      'ON CONFLICT (email) DO NOTHING RETURNING *',
      [email, email, hashedPassword, name, first_name, last_name, status || 'Active']
    );
    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'User creation failed, email may already exist' });
    }
    const user = result.rows[0];
    if (role) {
      await db.query(
        'INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2 ' +
        'ON CONFLICT ON CONSTRAINT user_roles_pkey DO NOTHING',
        [user.uid, role]
      );
    }
    await db.query('COMMIT');
    const finalResult = await db.query(`
      SELECT u.*, ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM fe_users u
      LEFT JOIN user_roles ur ON u.uid = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.uid = $1
      GROUP BY u.uid
    `, [user.uid]);
    res.json(finalResult.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Add user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/user-roles', verifyToken, async (req, res) => {
  if (!req.user.permissions.includes('assign_roles')) {
    return res.status(403).json({ message: 'Forbidden: assign_roles permission required' });
  }
  const { user_id, role_name } = req.body;
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM user_roles WHERE user_id = $1', [user_id]);
    const result = await db.query(
      'INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2 ' +
      'ON CONFLICT ON CONSTRAINT user_roles_pkey DO NOTHING RETURNING *',
      [user_id, role_name]
    );
    await db.query('COMMIT');
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Assign role error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;