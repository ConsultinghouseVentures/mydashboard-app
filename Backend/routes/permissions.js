// backend/routes/permissions.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware to verify JWT and admin role (case-insensitive)
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    // Check for 'Admin' in roles, case-insensitive
    const isAdmin = (decoded.roles && decoded.roles.some(r => r.toLowerCase() === 'admin')) || (decoded.role && decoded.role.toLowerCase() === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden: Admin access required' });
    req.user = decoded;
    next();
  });
};

// Middleware to verify permissions (updated to match DB permission names, e.g., 'view_clients' instead of 'read:clients')
const checkPermission = (permissionName) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRole = decoded.role || (decoded.roles && decoded.roles[0]) || 'user'; // Fallback to 'user' if missing
    const result = await db.query(
      'SELECT 1 FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id JOIN roles r ON rp.role_id = r.id WHERE r.name = $1 AND p.name = $2',
      [userRole, permissionName]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ message: `Permission denied: ${permissionName} required` });
    }
    next();
  } catch (err) {
    console.error('Permission check error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Define modules and their permissions based on your DB (add missing ones to DB if needed)
const modulePermissions = {
  users: ['view_users', 'edit_users', 'assign_roles'],
  clients: ['view_clients', 'edit_clients'],
  employees: ['view_employees', 'edit_employees'], // Insert these into permissions table if missing
};

// GET /api/permissions/permissions-matrix
router.get('/permissions-matrix', verifyAdmin, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const rolesResult = await client.query('SELECT name FROM roles');
    const roles = rolesResult.rows.map(row => row.name);
    const moduleData = {};
    Object.keys(modulePermissions).forEach(mod => {
      moduleData[mod] = {
        permissions: modulePermissions[mod],
        access: {},
      };
    });

    for (const role of roles) {
      const permsResult = await client.query(
        'SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id JOIN roles r ON rp.role_id = r.id WHERE r.name = $1',
        [role]
      );
      const rolePerms = permsResult.rows.map(row => row.name);
      Object.keys(moduleData).forEach(mod => {
        moduleData[mod].access[role] = {};
        moduleData[mod].permissions.forEach(perm => {
          moduleData[mod].access[role][perm] = rolePerms.includes(perm);
        });
      });
    }

    await client.query('COMMIT');
    res.json({ roles, moduleData });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fetch permissions error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/permissions/permissions-matrix
router.put('/permissions-matrix', verifyAdmin, async (req, res) => {
  const { moduleData } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const rolesResult = await client.query('SELECT name, id FROM roles');
    const roleIds = {};
    rolesResult.rows.forEach(row => roleIds[row.name] = row.id);
    const permsResult = await client.query('SELECT name, id FROM permissions');
    const permIds = {};
    permsResult.rows.forEach(row => permIds[row.name] = row.id);

    for (const module of Object.keys(moduleData)) {
      for (const [role, perms] of Object.entries(moduleData[module].access)) {
        const roleId = roleIds[role];
        if (!roleId) continue;
        for (const [perm, hasPerm] of Object.entries(perms)) {
          const permId = permIds[perm];
          if (!permId) continue;
          const exists = await client.query(
            'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
            [roleId, permId]
          );
          if (hasPerm && exists.rows.length === 0) {
            await client.query(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
              [roleId, permId]
            );
          } else if (!hasPerm && exists.rows.length > 0) {
            await client.query(
              'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
              [roleId, permId]
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update permissions error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/permissions/roles
router.get('/roles', verifyAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT name FROM roles');
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error('Fetch roles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/permissions/roles
router.post('/roles', verifyAdmin, async (req, res) => {
  const { role } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existingRole = await client.query('SELECT name FROM roles WHERE name = $1', [role]);
    if (existingRole.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Role already exists' });
    }
    await client.query('INSERT INTO roles (name) VALUES ($1)', [role]);
    await client.query('COMMIT');
    res.json({ message: 'Role added' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add role error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/permissions/roles
router.delete('/roles', verifyAdmin, async (req, res) => {
  const { roles } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM roles WHERE name = ANY($1)', [roles]);
    await client.query('DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name = ANY($1))', [roles]);
    await client.query('COMMIT');
    res.json({ message: 'Roles removed' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Remove roles error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
module.exports.checkPermission = checkPermission;