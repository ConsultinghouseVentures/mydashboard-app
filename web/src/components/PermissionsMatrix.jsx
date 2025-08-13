// src/components/PermissionsMatrix.jsx
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Typography,
  Box,
  Checkbox,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';

const PermissionsMatrix = () => {
  const { showSnackbar } = useSnackbar();
  const { user, refreshUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [selectedRolesToRemove, setSelectedRolesToRemove] = useState([]);

  const modules = ['users', 'clients', 'employees'];

  const [effectiveRoles, setEffectiveRoles] = useState([]);
  const [effectiveModuleData, setEffectiveModuleData] = useState({
    users: { permissions: ['view_users', 'edit_users', 'assign_roles', 'add_users', 'delete_users'], access: {} },
    clients: { permissions: ['view_clients', 'edit_clients', 'delete_clients'], access: {} },
    employees: { permissions: ['view_employees', 'edit_employees', 'delete_employees'], access: {} },
  });

  // Fetch permissions data from backend
  useEffect(() => {
    const fetchPermissionsData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        navigate('/login', { replace: true });
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Permissions matrix response:', response);
        const { roles, moduleData } = response;
        // Ensure delete_<module> is included in access for all roles
        const updatedModuleData = {
          users: {
            permissions: moduleData.users.permissions,
            access: {},
          },
          clients: {
            permissions: moduleData.clients.permissions,
            access: {},
          },
          employees: {
            permissions: moduleData.employees.permissions,
            access: {},
          },
        };
        roles.forEach((role) => {
          updatedModuleData.users.access[role] = {
            ...moduleData.users.access[role],
            delete_users: moduleData.users.access[role]?.delete_users || false,
          };
          updatedModuleData.clients.access[role] = {
            ...moduleData.clients.access[role],
            delete_clients: moduleData.clients.access[role]?.delete_clients || moduleData.clients.access[role]?.delete_employees || false,
          };
          updatedModuleData.employees.access[role] = {
            ...moduleData.employees.access[role],
            delete_employees: moduleData.employees.access[role]?.delete_employees || false,
          };
        });
        setEffectiveRoles(roles || []);
        setEffectiveModuleData(updatedModuleData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch permissions error:', err);
        if (err.response?.status === 401) {
          setError('Unauthorized access');
          localStorage.removeItem('token');
          refreshUser();
          navigate('/login', { replace: true });
        } else if (err.response?.status === 403) {
          setError('Permission denied: You do not have access to view the permissions matrix');
        } else {
          setError('Failed to fetch permissions data');
        }
        setLoading(false);
        showSnackbar('Failed to load permissions', 'error');
      }
    };
    fetchPermissionsData();
  }, [navigate, showSnackbar, refreshUser]);

  // Prepare rows for a module
  const getRows = (module) =>
    effectiveRoles.map((role) => ({
      id: role,
      role,
      ...effectiveModuleData[module].access[role],
      [`delete_${module}`]: effectiveModuleData[module].access[role]?.[`delete_${module}`] || false,
    }));

  // Columns for a module
  const getColumns = (module) => [
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      editable: user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin'),
    },
    ...effectiveModuleData[module].permissions.map((perm) => ({
      field: perm,
      headerName: perm.charAt(0).toUpperCase() + perm.slice(1).replace('_', ' '),
      width: 150,
      editable: user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin'),
      renderCell: (params) => {
        const hasAccess = params.value;
        return hasAccess ? <CheckIcon color="success" /> : <CloseIcon color="error" />;
      },
      renderEditCell: (params) => (
        <Checkbox
          checked={params.value}
          onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.checked })}
        />
      ),
    })),
  ];

  const handleProcessRowUpdate = async (newRow, oldRow, module) => {
    const isAdmin = user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin');
    if (!isAdmin) {
      showSnackbar('Only admins can edit permissions', 'error');
      return oldRow;
    }

    const updatedModuleData = { ...effectiveModuleData };
    const oldRole = oldRow.role;
    const newRole = newRow.role;

    console.log(`Updating row for module ${module}:`, { newRow, oldRow });

    if (newRole !== oldRole) {
      if (effectiveRoles.includes(newRole)) {
        showSnackbar('Role name already exists', 'error');
        return oldRow;
      }
      try {
        const token = localStorage.getItem('token');
        await api.put(
          '/permissions/roles',
          { oldRole, newRole },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const updatedRoles = effectiveRoles.map((r) => (r === oldRole ? newRole : r));
        setEffectiveRoles(updatedRoles);
        modules.forEach((mod) => {
          const modAccess = { ...updatedModuleData[mod].access };
          if (modAccess[oldRole]) {
            modAccess[newRole] = { ...modAccess[oldRole] };
            delete modAccess[oldRole];
            updatedModuleData[mod].access = modAccess;
          }
        });
      } catch (err) {
        console.error('Role rename error:', err);
        if (err.response?.status === 403) {
          showSnackbar('Permission denied to rename role', 'error');
        } else {
          showSnackbar('Failed to rename role', 'error');
        }
        return oldRow;
      }
    }

    const currentAccess = { ...updatedModuleData[module].access };
    const roleAccess = { ...currentAccess[newRole || oldRow.role] };
    // Update all permissions, including delete_<module>
    const allPermissions = [...effectiveModuleData[module].permissions, `delete_${module}`];
    allPermissions.forEach((perm) => {
      if (newRow[perm] !== oldRow[perm]) {
        roleAccess[perm] = newRow[perm];
      }
    });
    currentAccess[newRole || oldRow.role] = roleAccess;
    updatedModuleData[module].access = currentAccess;

    try {
      const token = localStorage.getItem('token');
      console.log('Sending updated module data:', updatedModuleData);
      await api.put(
        '/permissions/permissions-matrix',
        { moduleData: updatedModuleData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEffectiveModuleData(updatedModuleData);
      showSnackbar('Permissions updated successfully', 'success');
      return newRow;
    } catch (err) {
      console.error('Update permissions error:', err);
      if (err.response?.status === 403) {
        showSnackbar('Permission denied to update permissions', 'error');
      } else {
        showSnackbar('Failed to update permissions', 'error');
      }
      return oldRow;
    }
  };

  const handleAddRole = async () => {
    const isAdmin = user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin');
    if (!isAdmin) {
      showSnackbar('Only admins can add roles', 'error');
      return;
    }
    if (!newRoleName.trim() || effectiveRoles.includes(newRoleName)) {
      showSnackbar('Role name is empty or already exists', 'error');
      return;
    }
    const updatedRoles = [...effectiveRoles, newRoleName];
    const updatedModuleData = { ...effectiveModuleData };
    modules.forEach((mod) => {
      const modAccess = { ...updatedModuleData[mod].access };
      modAccess[newRoleName] = Object.fromEntries(
        [...updatedModuleData[mod].permissions, `delete_${mod}`].map((perm) => [perm, false])
      );
      updatedModuleData[mod].access = modAccess;
    });

    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/permissions/roles',
        { role: newRoleName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await api.put(
        '/permissions/permissions-matrix',
        { moduleData: updatedModuleData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEffectiveRoles(updatedRoles);
      setEffectiveModuleData(updatedModuleData);
      setNewRoleName('');
      setOpenAddDialog(false);
      showSnackbar('Role added successfully', 'success');
    } catch (err) {
      console.error('Add role error:', err);
      if (err.response?.status === 403) {
        showSnackbar('Permission denied to add role', 'error');
      } else {
        showSnackbar('Failed to add role', 'error');
      }
    }
  };

  const handleToggleRoleSelection = (role) => {
    setSelectedRolesToRemove((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleRemoveRoles = async () => {
    const isAdmin = user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin');
    if (!isAdmin) {
      showSnackbar('Only admins can remove roles', 'error');
      return;
    }
    if (selectedRolesToRemove.length === 0) return;

    const updatedRoles = effectiveRoles.filter((role) => !selectedRolesToRemove.includes(role));
    const updatedModuleData = { ...effectiveModuleData };
    modules.forEach((mod) => {
      const modAccess = { ...updatedModuleData[mod].access };
      selectedRolesToRemove.forEach((role) => delete modAccess[role]);
      updatedModuleData[mod].access = modAccess;
    });

    try {
      const token = localStorage.getItem('token');
      await api.delete(
        '/permissions/roles',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { roles: selectedRolesToRemove },
        }
      );
      await api.put(
        '/permissions/permissions-matrix',
        { moduleData: updatedModuleData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEffectiveRoles(updatedRoles);
      setEffectiveModuleData(updatedModuleData);
      setSelectedRolesToRemove([]);
      setOpenRemoveDialog(false);
      showSnackbar('Roles removed successfully', 'success');
    } catch (err) {
      console.error('Remove roles error:', err);
      if (err.response?.status === 403) {
        showSnackbar('Permission denied to remove roles', 'error');
      } else {
        showSnackbar('Failed to remove roles', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '400px' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setOpenAddDialog(true)} disabled={!(user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin'))}>
          Add Role
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => setOpenRemoveDialog(true)}
          disabled={!(user?.role?.toLowerCase() === 'admin' || (Array.isArray(user?.roles) && user?.roles[0]?.toLowerCase() === 'admin'))}
        >
          Remove Role
        </Button>
      </Box>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      <Box sx={{ height: '400px', width: '100%' }}>
        <DataGrid
          rows={getRows('users')}
          columns={getColumns('users')}
          processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'users')}
          onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
          editMode="row"
          disableSelectionOnClick
        />
      </Box>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Clients Management
      </Typography>
      <Box sx={{ height: '400px', width: '100%' }}>
        <DataGrid
          rows={getRows('clients')}
          columns={getColumns('clients')}
          processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'clients')}
          onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
          editMode="row"
          disableSelectionOnClick
        />
      </Box>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Employee Management
      </Typography>
      <Box sx={{ height: '400px', width: '100%' }}>
        <DataGrid
          rows={getRows('employees')}
          columns={getColumns('employees')}
          processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'employees')}
          onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
          editMode="row"
          disableSelectionOnClick
        />
      </Box>
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="standard"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddRole}>Add</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openRemoveDialog} onClose={() => setOpenRemoveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Remove Roles</DialogTitle>
        <DialogContent>
          <List>
            {effectiveRoles.map((role) => (
              <ListItem key={role} disablePadding>
                <ListItemIcon>
                  <Checkbox
                    checked={selectedRolesToRemove.includes(role)}
                    onChange={() => handleToggleRoleSelection(role)}
                  />
                </ListItemIcon>
                <ListItemText primary={role} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemoveDialog(false)}>Cancel</Button>
          <Button onClick={handleRemoveRoles} color="error" disabled={selectedRolesToRemove.length === 0}>
            Remove Selected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionsMatrix;