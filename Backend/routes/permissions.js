// backend/routes/permissions.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const auth = require('../middleware/auth');

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  if (!req.user) {
    console.error('No user object in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const userRole = Array.isArray(req.user.roles) && req.user.roles.length > 0 ? req.user.roles[0] : req.user.role || null;
  if (!userRole) {
    console.error('No role assigned to user:', req.user);
    return res.status(403).json({ message: 'No role assigned to user' });
  }
  try {
    const result = await db.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND r.name = $2`,
      [req.user.uid, 'Admin']
    );
    if (result.rows.length > 0) {
      next();
    } else {
      console.error('Non-admin role attempted access:', userRole);
      return res.status(403).json({ message: 'Admin access required' });
    }
  } catch (err) {
    console.error('Admin check error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check specific permissions
const checkPermission = (module, action) => async (req, res, next) => {
  if (!req.user) {
    console.error('No user object in request for permission check');
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const userRole = Array.isArray(req.user.roles) && req.user.roles.length > 0 ? req.user.roles[0] : req.user.role || null;
  if (!userRole) {
    console.error('No role assigned to user for permission check:', req.user);
    return res.status(403).json({ message: 'No role assigned to user' });
  }
  try {
    const permissionResult = await db.query(
      `SELECT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       WHERE r.name = $1 AND p.name = $2`,
      [userRole, `${action}_${module}`]
    );
    if (permissionResult.rows.length > 0 || userRole.toLowerCase() === 'admin') {
      next();
    } else {
      console.error(`Permission ${action}_${module} denied for role:`, userRole);
      res.status(403).json({ message: `Permission ${action}_${module} denied` });
    }
  } catch (err) {
    console.error('Check permission error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/permissions/roles
router.get('/roles', auth, verifyAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT name FROM roles');
    res.json(result.rows.map((row) => row.name));
  } catch (err) {
    console.error('Fetch roles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/permissions/roles
router.post('/roles', auth, verifyAdmin, async (req, res) => {
  const { role } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('INSERT INTO roles (name) VALUES ($1) RETURNING name', [role]);
    await client.query('COMMIT');
    res.json({ message: 'Role added', role: result.rows[0].name });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add role error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/permissions/roles
router.put('/roles', auth, verifyAdmin, async (req, res) => {
  const { oldRole, newRole } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('UPDATE roles SET name = $1 WHERE name = $2 RETURNING name', [newRole, oldRole]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Role not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Role updated', role: result.rows[0].name });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update role error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/permissions/roles
router.delete('/roles', auth, verifyAdmin, async (req, res) => {
  const { roles } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const role of roles) {
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        await client.query('DELETE FROM user_roles WHERE role_id = $1', [roleId]);
        await client.query('DELETE FROM roles WHERE id = $1', [roleId]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Roles deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete roles error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/permissions/permissions-matrix
router.get('/permissions-matrix', auth, async (req, res) => {
  try {
    const rolesResult = await db.query('SELECT name FROM roles');
    const roles = rolesResult.rows.map((row) => row.name);
    const moduleData = {
      users: { permissions: ['view_users', 'edit_users', 'assign_roles', 'add_users', 'delete_users'], access: {} },
      clients: { permissions: ['view_clients', 'edit_clients', 'delete_clients'], access: {} },
      employees: { permissions: ['view_employees', 'edit_employees', 'delete_employees'], access: {} },
    };
    for (const role of roles) {
      const permissionsResult = await db.query(
        `SELECT p.name
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN roles r ON rp.role_id = r.id
         WHERE r.name = $1`,
        [role]
      );
      const rolePermissions = permissionsResult.rows.map((row) => row.name);
      moduleData.users.access[role] = {
        view_users: rolePermissions.includes('view_users') || role.toLowerCase() === 'admin',
        edit_users: rolePermissions.includes('edit_users') || role.toLowerCase() === 'admin',
        assign_roles: rolePermissions.includes('assign_roles') || role.toLowerCase() === 'admin',
        add_users: rolePermissions.includes('add_users') || role.toLowerCase() === 'admin',
        delete_users: rolePermissions.includes('delete_users') || role.toLowerCase() === 'admin',
      };
      moduleData.clients.access[role] = {
        view_clients: rolePermissions.includes('view_clients') || role.toLowerCase() === 'admin',
        edit_clients: rolePermissions.includes('edit_clients') || role.toLowerCase() === 'admin',
        delete_clients: rolePermissions.includes('delete_clients') || role.toLowerCase() === 'admin',
      };
      moduleData.employees.access[role] = {
        view_employees: rolePermissions.includes('view_employees') || role.toLowerCase() === 'admin',
        edit_employees: rolePermissions.includes('edit_employees') || role.toLowerCase() === 'admin',
        delete_employees: rolePermissions.includes('delete_employees') || role.toLowerCase() === 'admin',
      };
    }
    res.json({ roles, moduleData });
  } catch (err) {
    console.error('Fetch permissions matrix error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permissions/permissions-matrix
router.put('/permissions-matrix', auth, verifyAdmin, async (req, res) => {
  const { moduleData } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM role_permissions');
    for (const module of ['users', 'clients', 'employees']) {
      const permissions = [...moduleData[module].permissions, `delete_${module}`];
      for (const role in moduleData[module].access) {
        const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
        if (roleResult.rows.length === 0) continue;
        const roleId = roleResult.rows[0].id;
        for (const perm of permissions) {
          if (moduleData[module].access[role][perm]) {
            const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [perm]);
            if (permResult.rows.length === 0) {
              const newPerm = await client.query('INSERT INTO permissions (name, module) VALUES ($1, $2) RETURNING id', [perm, module]);
              await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, newPerm.rows[0].id]);
            } else {
              await client.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, permResult.rows[0].id]);
            }
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Permissions updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update permissions matrix error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

router.checkPermission = checkPermission;

module.exports = router;