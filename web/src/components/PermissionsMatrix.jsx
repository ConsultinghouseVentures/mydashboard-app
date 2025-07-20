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
    users: { permissions: [], access: {} },
    clients: { permissions: [], access: {} },
    employees: { permissions: [], access: {} },
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
        const response = await api.get('/api/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { roles, moduleData } = response; // Adjusted for backend response
        setEffectiveRoles(roles);
        setEffectiveModuleData(moduleData);
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
    }));

  // Columns for a module
  const getColumns = (permissions) => [
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      editable: user?.role.toLowerCase() === 'admin',
    },
    ...permissions.map((perm) => ({
      field: perm,
      headerName: perm.charAt(0).toUpperCase() + perm.slice(1).replace('_', ' '),
      width: 150,
      editable: user?.role.toLowerCase() === 'admin',
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
    if (user?.role.toLowerCase() !== 'admin') {
      showSnackbar('Only admins can edit permissions', 'error');
      return oldRow;
    }

    const updatedModuleData = { ...effectiveModuleData };
    const oldRole = oldRow.role;
    const newRole = newRow.role;

    if (newRole !== oldRole) {
      if (effectiveRoles.includes(newRole)) {
        showSnackbar('Role name already exists', 'error');
        return oldRow;
      }
      try {
        const token = localStorage.getItem('token');
        await api.put(
          '/api/permissions/roles',
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
    effectiveModuleData[module].permissions.forEach((perm) => {
      if (newRow[perm] !== oldRow[perm]) {
        roleAccess[perm] = newRow[perm];
      }
    });
    currentAccess[newRole || oldRow.role] = roleAccess;
    updatedModuleData[module].access = currentAccess;

    try {
      const token = localStorage.getItem('token');
      await api.put(
        '/api/permissions/permissions-matrix',
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
    if (user?.role.toLowerCase() !== 'admin') {
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
      modAccess[newRoleName] = Object.fromEntries(updatedModuleData[mod].permissions.map((perm) => [perm, false]));
      updatedModuleData[mod].access = modAccess;
    });

    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/api/permissions/roles',
        { role: newRoleName },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await api.put(
        '/api/permissions/permissions-matrix',
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
    if (user?.role.toLowerCase() !== 'admin') {
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
        '/api/permissions/roles',
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { roles: selectedRolesToRemove },
        }
      );
      await api.put(
        '/api/permissions/permissions-matrix',
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
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => setOpenAddDialog(true)} disabled={user?.role.toLowerCase() !== 'admin'}>
          Add Role
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => setOpenRemoveDialog(true)}
          disabled={user?.role.toLowerCase() !== 'admin'}
        >
          Remove Role
        </Button>
      </Box>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      <Typography variant="h6" gutterBottom>
        Roles and Permissions Matrix
      </Typography>
      <DataGrid
        rows={getRows('users')}
        columns={getColumns(effectiveModuleData.users.permissions)}
        processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'users')}
        onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
        editMode="row"
        disableSelectionOnClick
        autoHeight
      />
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Clients Management
      </Typography>
      <Typography variant="h6" gutterBottom>
        Roles and Permissions Matrix
      </Typography>
      <DataGrid
        rows={getRows('clients')}
        columns={getColumns(effectiveModuleData.clients.permissions)}
        processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'clients')}
        onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
        editMode="row"
        disableSelectionOnClick
        autoHeight
      />
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Employee Management
      </Typography>
      <Typography variant="h6" gutterBottom>
        Roles and Permissions Matrix
      </Typography>
      <DataGrid
        rows={getRows('employees')}
        columns={getColumns(effectiveModuleData.employees.permissions)}
        processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'employees')}
        onProcessRowUpdateError={(error) => console.error('Row update error:', error)}
        editMode="row"
        disableSelectionOnClick
        autoHeight
      />
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