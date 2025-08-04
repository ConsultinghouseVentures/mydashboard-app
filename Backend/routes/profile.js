// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    console.error('No token provided in headers:', req.headers);
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// GET /api/profile - Fetch current user's profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT uid, username, email, created_at, updated_at, status, role, first_name, last_name, name,
              academic_title, salutation, gender, phone, website, employment_start, employment_end,
              religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth,
              birth_name, citizenship, place_of_residence, street1, street2, zip, city, state, country,
              bank_name, bank_code_no, bank_account_no, iban, swift_bic
       FROM fe_users WHERE uid = $1`,
      [req.user.uid]
    );
    console.log('Query result:', result.rows);
    if (result.rows.length === 0) {
      console.error('No user found for uid:', req.user.uid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Profile data fetched:', result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', verifyToken, async (req, res) => {
  const {
    username, email, first_name, last_name, name, academic_title, salutation, gender, phone, website,
    employment_start, employment_end, religion, marital_status, education, date_of_birth,
    place_of_birth, country_of_birth, birth_name, citizenship, place_of_residence, street1,
    street2, zip, city, state, country, bank_name, bank_code_no, bank_account_no, iban, swift_bic
  } = req.body;
  try {
    console.log('Received update data:', req.body);
    const result = await db.query(
      `UPDATE fe_users SET
        username = $1, email = $2, first_name = $3, last_name = $4, name = $5,
        academic_title = $6, salutation = $7, gender = $8, phone = $9, website = $10,
        employment_start = $11, employment_end = $12, religion = $13, marital_status = $14,
        education = $15, date_of_birth = $16, place_of_birth = $17, country_of_birth = $18,
        birth_name = $19, citizenship = $20, place_of_residence = $21, street1 = $22,
        street2 = $23, zip = $24, city = $25, state = $26, country = $27, bank_name = $28,
        bank_code_no = $29, bank_account_no = $30, iban = $31, swift_bic = $32, updated_at = NOW()
       WHERE uid = $33
       RETURNING uid, username, email, created_at, updated_at, role, status, first_name, last_name, name,
                academic_title, salutation, gender, phone, website, employment_start, employment_end,
                religion, marital_status, education, date_of_birth, place_of_birth, country_of_birth,
                birth_name, citizenship, place_of_residence, street1, street2, zip, city, state, country,
                bank_name, bank_code_no, bank_account_no, iban, swift_bic`,
      [
        username || null, email || null, first_name || null, last_name || null, name || null,
        academic_title || null, salutation || null, gender || null, phone || null, website || null,
        employment_start || null, employment_end || null, religion || null, marital_status || null,
        education || null, date_of_birth || null, place_of_birth || null, country_of_birth || null,
        birth_name || null, citizenship || null, place_of_residence || null, street1 || null,
        street2 || null, zip || null, city || null, state || null, country || null, bank_name || null,
        bank_code_no || null, bank_account_no || null, iban || null, swift_bic || null,
        req.user.uid
      ]
    );
    if (result.rows.length === 0) {
      console.error('No user found for update, uid:', req.user.uid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Profile updated:', result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/change-password - Update current user's password
router.put('/change-password', verifyToken, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'UPDATE fe_users SET password_hash = $1, updated_at = NOW() WHERE uid = $2 RETURNING uid',
      [password_hash, req.user.uid]
    );
    if (result.rows.length === 0) {
      console.error('No user found for password update, uid:', req.user.uid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Password updated for uid:', req.user.uid);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;