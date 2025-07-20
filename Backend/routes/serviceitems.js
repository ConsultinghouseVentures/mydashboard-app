// Backend/routes/serviceitems.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT uid, title, detail_description, date_from, date_to FROM tx_mpmydashboard_domain_model_serviceitems');
    console.log('Service items query result:', result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Service items error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;