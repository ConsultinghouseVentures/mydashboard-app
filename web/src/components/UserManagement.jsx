// src/components/UserManagement.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTableOverview, LayoutContext } from './Layout_TableOverview.jsx';
import {
  Typography, Box, Button, DialogTitle, DialogContent, DialogActions, Checkbox, List, ListItem, ListItemText,
  Menu, MenuItem, Dialog, TextField, FormControl, InputLabel, Select, CircularProgress,
} from '@mui/material';
import { FilterAlt as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import TableFilterDialog, { applyFilterRules } from './TableFilterDialog';
import SearchBox from './SearchBox';
import SavedViews from './SavedViews';
import LayoutLightbox from './Layout_Lightbox.jsx';
import TableLightbox from './TableLightbox';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';
import { useUserRoles } from '../constants/roles';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <Typography color="error">Something went wrong.</Typography>
          <Button onClick={() => this.setState({ hasError: false })}>Retry</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const UserManagement = () => {
  const { dialogStyle, lightboxStyles, tableStyles, isSidebarCollapsed } = useContext(LayoutContext) || {};
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const navigate = useNavigate();
  const { roles, loading: rolesLoading, error: rolesError } = useUserRoles();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({ users: { access: {} }, clients: { access: {} }, employees: { access: {} } });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [savedViews, setSavedViews] = useState(() => JSON.parse(localStorage.getItem('userViews')) || []);
  const [selectedView, setSelectedView] = useState('');
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lightboxMode, setLightboxMode] = useState('view');
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewsDialog, setOpenViewsDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterRules, setFilterRules] = useState([]);
  const [addFormData, setAddFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    status: 'Active',
    role: 'User',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [columnsConfig, setColumnsConfig] = useState([
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 150,
      visible: true,
      renderCell: (params) => (
        <Typography
          component="span"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            '&:hover': { textDecoration: 'underline' },
            display: 'inline-block',
            width: '100%',
            height: '100%',
            p: 0,
          }}
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/users/${params.row?.uid}`);
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'first_name',
      headerName: 'First Name',
      flex: 1,
      minWidth: 150,
      visible: true,
      renderCell: (params) => (
        <Typography
          component="span"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            '&:hover': { textDecoration: 'underline' },
            display: 'inline-block',
            width: '100%',
            height: '100%',
            p: 0,
          }}
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/users/${params.row?.uid}`);
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      visible: true,
    },
    {
      field: 'roles',
      headerName: 'User Roles',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: permissions.users?.access[user?.roles?.[0]]?.['write:users'] ?? false,
      type: 'singleSelect',
      valueOptions: roles.map(role => role.value),
      valueGetter: (params) => params.row?.roles?.[0] || '',
      renderCell: (params) => params.row?.roles?.join(', ') || '',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: permissions.users?.access[user?.roles?.[0]]?.['write:users'] ?? false,
      type: 'singleSelect',
      valueOptions: ['Active', 'Inactive'],
    },
    { field: 'uid', headerName: 'ID', flex: 0.5, minWidth: 80, visible: false },
    { field: 'created_at', headerName: 'Created At', flex: 1, minWidth: 150, visible: false, type: 'date' },
    { field: 'updated_at', headerName: 'Updated At', flex: 1, minWidth: 150, visible: false, type: 'date' },
    { field: 'created_by', headerName: 'Created By', flex: 0.5, minWidth: 80, visible: false },
    {
      field: 'actions',
      headerName: '',
      width: 250,
      sortable: false,
      filterable: false,
      visible: true,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            opacity: 0,
            transition: 'opacity 0.2s',
            '& .MuiButton-root': { m: 0.5, minWidth: '70px' },
            '.MuiDataGrid-row:hover &': {
              opacity: 1,
            },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedUser(params.row);
              setLightboxMode('view');
            }}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedUser(params.row);
              setLightboxMode('edit');
            }}
            disabled={!(permissions.users?.access[user?.roles?.[0]]?.['write:users'] ?? false)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setActionsAnchorEl(event.currentTarget);
              setUserToDelete(params.row);
            }}
            disabled={!(permissions.users?.access[user?.roles?.[0]]?.['delete:users'] ?? false)}
          >
            Actions
          </Button>
        </Box>
      ),
    },
  ]);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const response = await api.get('/api/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPermissions(response.moduleData || { users: { access: {} }, clients: { access: {} }, employees: { access: {} } });  // Adjusted for backend response and fallback
      } catch (err) {
        console.error('Fetch permissions error:', err);
        setError('Failed to load permissions');
      }
    };
    fetchPermissions();
  }, [navigate]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const response = await api.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Users API full response:', response);
        const data = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
        console.log('Users API response data:', data);
        const formattedData = data.map((row) => ({
          ...row,
          created_at: row.created_at ? new Date(row.created_at * 1000) : null, // Convert Unix timestamp
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
          roles: row.roles || [row.role || 'User'], // Fallback to single role if array not present
        }));
        console.log('Setting users:', formattedData);
        setUsers(formattedData);
        setError(null);
      } catch (error) {
        console.error('Fetch users error:', {
          message: error.message,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : 'No response data',
        });
        setError(error.response?.data?.message || 'Failed to fetch users');
        if (error.response?.status === 401) {
          console.log('Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      }
    };
    if (permissions.users?.access[user?.roles?.[0]]?.['view_users'] ?? true) { // Updated to match DB permission name
      fetchUsers();
    } else {
      setError('Permission denied to view users');
    }
  }, [navigate, user?.roles, permissions]);

  useEffect(() => {
    localStorage.setItem('userViews', JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem('userFilterRules', JSON.stringify(filterRules));
  }, [filterRules]);

  const handleColumnToggle = (field) => {
    setColumnsConfig(prev => prev.map((col) =>
      col.field === field ? { ...col, visible: !col.visible } : col
    ));
  };

  const getFilteredUsers = () => {
    const searchFilter = (user) => {
      if (!filter) return true;
      const search = filter.toLowerCase().trim();
      return (
        user.last_name?.toLowerCase()?.includes(search) ||
        user.first_name?.toLowerCase()?.includes(search) ||
        user.email?.toLowerCase()?.includes(search) ||
        user.roles?.some(role => role.toLowerCase().includes(search)) ||
        user.status?.toLowerCase()?.includes(search)
      );
    };
    return applyFilterRules(users, filterRules, searchFilter);
  };

  const handleFilterClick = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleFilterClose = () => {
    console.log('handleFilterClose called, setting anchorEl to null');
    setAnchorEl(null);
  };

  const handleAddRule = () => {
    const newRule = {
      id: Date.now(),
      field: '',
      operator: '',
      value: '',
    };
    setFilterRules([...filterRules, newRule]);
  };

  const handleViewsDialogOpen = () => {
    setOpenViewsDialog(true);
  };

  const handleViewsDialogClose = () => {
    setOpenViewsDialog(false);
  };

  const handleSaveEdit = async (updatedData) => {
    if (!(permissions.users?.access[user?.roles?.[0]]?.['edit_users'] ?? false)) { // Updated to match DB
      showSnackbar('Permission denied to edit users', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      showSnackbar('No authentication token found', 'error');
      return;
    }
    try {
      console.log('Saving data:', updatedData);
      const response = await api.put(`/api/users/${updatedData.uid}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API response:', response);
      const newData = response.data;
      if (!newData || !newData.uid) {
        throw new Error('Invalid response data');
      }
      setUsers((prev) => prev.map((c) => (c.uid === newData.uid ? { ...newData, created_at: newData.created_at ? new Date(newData.created_at * 1000) : null, updated_at: newData.updated_at ? new Date(newData.updated_at) : null } : c)));
      setSelectedUser(null);
      showSnackbar('User updated successfully', 'success');
      return newData;
    } catch (err) {
      console.error('Update error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update user', 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!(permissions.users?.access[user?.roles?.[0]]?.['delete:users'] ?? false)) { // Update if DB has 'delete_users'
      showSnackbar('Permission denied to delete users', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || !userToDelete) {
      console.error('No token or user to delete');
      showSnackbar('No authentication token or user selected', 'error');
      return;
    }
    try {
      await api.delete(`/api/users/${userToDelete.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      showSnackbar('User deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setUserToDelete(null);
      setActionsAnchorEl(null);
    }
  };

  const handleCellEditCommit = async (params) => {
    if (!(permissions.users?.access[user?.roles?.[0]]?.['edit_users'] ?? false)) { // Updated to match DB
      showSnackbar('Permission denied to edit users', 'error');
      return;
    }
    const { id, field, value } = params;
    const updatedUser = users.find((user) => user.uid === id);
    if (updatedUser && (field === 'status' || field === 'roles')) {
      try {
        const token = localStorage.getItem('token');
        if (field === 'roles') {
          await api.post('/api/user-roles', { user_id: id, role_name: value }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          const updatedData = { ...updatedUser, [field]: value };
          await api.put(`/api/users/${id}`, updatedData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        const response = await api.get(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response.data;
        setUsers((prev) => prev.map((c) => (c.uid === newData.uid ? { ...newData, created_at: newData.created_at ? new Date(newData.created_at * 1000) : null, updated_at: newData.updated_at ? new Date(newData.updated_at) : null } : c)));
        showSnackbar('User updated successfully', 'success');
      } catch (err) {
        console.error('Inline edit error:', err);
        showSnackbar(err.response?.data?.message || 'Failed to update user', 'error');
        setUsers((prev) => prev.map((c) => (c.uid === id ? { ...c, [field]: updatedUser[field] } : c)));
      }
    }
  };

  const processRowUpdate = (newRow, oldRow) => {
    const updatedRow = { ...newRow };
    if (newRow.status !== oldRow.status || newRow.roles?.[0] !== oldRow.roles?.[0]) {
      handleCellEditCommit({ id: newRow.uid, field: 'status', value: newRow.status });
      if (newRow.roles?.[0] !== oldRow.roles?.[0]) {
        handleCellEditCommit({ id: newRow.uid, field: 'roles', value: newRow.roles?.[0] });
      }
    }
    return updatedRow;
  };

  const handleNewUser = () => {
    if (!(permissions.users?.access[user?.roles?.[0]]?.['add:users'] ?? false)) {
      showSnackbar('Permission denied to add users', 'error');
      return;
    }
    setOpenAddDialog(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async () => {
    if (!(permissions.users?.access[user?.roles?.[0]]?.['add:users'] ?? false)) {
      showSnackbar('Permission denied to add users', 'error');
      return;
    }
    setAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/api/users', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('User added successfully', 'success');
      setUsers((prev) => [...prev, {
        ...response.data,
        created_at: response.data.created_at ? new Date(response.data.created_at * 1000) : null,
        updated_at: response.data.updated_at ? new Date(response.data.updated_at) : null,
        roles: response.data.roles || ['User'],
      }]);
      setOpenAddDialog(false);
      setAddFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        status: 'Active',
        role: 'User',
      });
    } catch (err) {
      console.error('Add user error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add user', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredUsers = getFilteredUsers();

  console.log('Users state:', users);
  console.log('Filter:', filter);
  console.log('Filter rules:', filterRules);
  console.log('Filtered users:', filteredUsers);

  if (rolesLoading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  }

  if (rolesError) {
    return <Typography color="error" sx={{ mt: 4 }}>{rolesError}</Typography>;
  }

  return (
    <LayoutTableOverview showBackTop={true} showBackBottom={true}>
      <Box sx={{ width: '100%', minWidth: '800px', display: 'flex', flexDirection: 'row', position: 'relative', overflowX: 'auto' }}>
        <ErrorBoundary>
          <SavedViews
            savedViews={savedViews}
            setSavedViews={setSavedViews}
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            setFilterRules={setFilterRules}
            filterRules={filterRules}
            open={openViewsDialog}
            onClose={handleViewsDialogClose}
          />
        </ErrorBoundary>
        <Box
          sx={{
            flexGrow: 1,
            minWidth: '800px',
            ml: isSidebarCollapsed ? '-50px' : 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            pr: '60px',
          }}
        >
          <Box sx={{ position: 'relative', minWidth: '800px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 8, maxWidth: '100%', minWidth: '800px' }}>
              <Typography variant="h4" component="h1" sx={{ ml: 0, textAlign: 'left' }}>
                User Management
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right', maxWidth: '100%' }}>
                <SearchBox value={filter} onChange={setFilter} onClear={setFilter} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewUser}
                  disabled={!(permissions.users?.access[user?.roles?.[0]]?.['add:users'] ?? false)}
                >
                  New User
                </Button>
              </Box>
            </Box>
            <Box sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, width: '100%', maxWidth: '100%', minWidth: '800px' }}>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', textAlign: 'right' }}>
                <Button
                  variant={openViewsDialog ? 'contained' : 'outlined'}
                  onClick={handleViewsDialogOpen}
                  aria-pressed={openViewsDialog}
                  sx={{ minWidth: 120 }}
                >
                  Views
                </Button>
                <Button variant="outlined" onClick={handleFilterClick} startIcon={<FilterIcon />}>
                  Add Filter
                </Button>
                <Button variant="outlined" onClick={() => setOpenColumnDialog(true)}>
                  Columns
                </Button>
              </Box>
            </Box>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Box sx={{ minHeight: '400px', width: '100%' }}>  
              <DataGrid
                rows={filteredUsers}
                columns={columnsConfig.filter((col) => col.visible)}
                getRowId={(row) => row.uid}
                pageSizeOptions={[5, 10, 20, 100]}
                onCellEditCommit={handleCellEditCommit}
                processRowUpdate={processRowUpdate}
                editMode="cell"
                sx={{
                  width: '100%',  // Ensure full width
                  ...tableStyles,
                  '& .MuiDataGrid-row': {
                    position: 'relative',
                  },
                }}
                disableSelectionOnClick
              />
            </Box>
            <Menu
              anchorEl={actionsAnchorEl}
              open={Boolean(actionsAnchorEl)}
              onClose={() => setActionsAnchorEl(null)}
            >
              <MenuItem
                onClick={() => {
                  setOpenDeleteDialog(true);
                  setActionsAnchorEl(null);
                }}
                disabled={!(permissions.users?.access[user?.roles?.[0]]?.['delete:users'] ?? false)}
              >
                Delete
              </MenuItem>
            </Menu>
            <Dialog
              open={openDeleteDialog}
              onClose={() => setOpenDeleteDialog(false)}
            >
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                <Typography>Do you want to delete this user?</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteDialog(false)}>No</Button>
                <Button onClick={handleDelete} color="error">Yes</Button>
              </DialogActions>
            </Dialog>
          </Box>
          <ErrorBoundary>
            {columnsConfig.length > 0 && (
              <TableFilterDialog
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                columnsConfig={columnsConfig}
                filterRules={filterRules}
                setFilterRules={setFilterRules}
                onClose={handleFilterClose}
                onFilterClick={handleAddRule}
              />
            )}
          </ErrorBoundary>
          <ErrorBoundary>
            <LayoutLightbox open={openColumnDialog} onClose={() => setOpenColumnDialog(false)}>
              <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem' }}>
                Manage Columns
              </DialogTitle>
              <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
                <List>
                  {columnsConfig.map((col) => (
                    <ListItem key={col.field}>
                      <Checkbox
                        checked={col.visible}
                        onChange={() => handleColumnToggle(col.field)}
                      />
                      <ListItemText primary={col.headerName} />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions sx={lightboxStyles ? lightboxStyles.actions : { p: 1 }}>
                <Button size="small" onClick={() => setOpenColumnDialog(false)}>
                  Close
                </Button>
              </DialogActions>
            </LayoutLightbox>
          </ErrorBoundary>
          <ErrorBoundary>
            <TableLightbox
              open={!!selectedUser}
              mode={lightboxMode}
              data={selectedUser}
              columnsConfig={columnsConfig}
              onClose={() => setSelectedUser(null)}
              onSave={handleSaveEdit}
              onEdit={() => setLightboxMode('edit')}
            />
          </ErrorBoundary>
        </Box>
      </Box>
      <LayoutLightbox open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem' }}>
          Add New User
        </DialogTitle>
        <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
          <TextField
            label="First Name"
            name="first_name"
            value={addFormData.first_name}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Last Name"
            name="last_name"
            value={addFormData.last_name}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={addFormData.email}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={addFormData.password}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select name="status" value={addFormData.status} onChange={handleAddChange}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>User Role</InputLabel>
            <Select name="role" value={addFormData.role} onChange={handleAddChange}>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={lightboxStyles ? lightboxStyles.actions : { p: 1 }}>
          <Button size="small" onClick={() => setOpenAddDialog(false)}>
            Cancel
          </Button>
          <Button size="small" onClick={handleAddSubmit} disabled={addLoading}>
            {addLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </LayoutLightbox>
    </LayoutTableOverview>
  );
};

export default UserManagement;