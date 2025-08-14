// backend/src/controllers/employeeController.js
const pool = require('../config/db');

exports.getEmployees = async (req, res) => {
  try {
    const clientId = req.query.client_id;
    const role = req.query.role;
    let query = 'SELECT uid, first_name, last_name, email, status, role, user_roles, client_id FROM fe_users WHERE deleted = false';
    const values = [];
    if (clientId) {
      query += ' AND client_id = $1';
      values.push(clientId);
    }
    if (role) {
      query += values.length ? ' AND role = $2' : ' AND role = $1';
      values.push(role);
    }
    const result = await pool.query(query, values);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { uid } = req.params;
  const { first_name, last_name, email, status, role, client_id } = req.body;
  try {
    const query = `
      UPDATE fe_users
      SET first_name = $1, last_name = $2, email = $3, status = $4, role = $5, client_id = $6, user_roles = $7
      WHERE uid = $8 AND deleted = false
      RETURNING *;
    `;
    const values = [first_name, last_name, email, status, role, client_id, `{${role}}`, uid];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ message: 'Server error' });
  }
};