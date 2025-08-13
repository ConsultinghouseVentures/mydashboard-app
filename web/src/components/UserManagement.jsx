// src/components/UserManagement.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
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
import jwtDecode from 'jwt-decode';
import * as Yup from 'yup';

const usernameSchema = Yup.string().email('Invalid email address').required('User name (email) is required');

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
  const [permissionsLoading, setPermissionsLoading] = useState(true);
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
    username: '',
    password: '',
    status: 'Active',
    role: 'User',
    name: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debug logs
  useEffect(() => {
    console.log('User:', user);
    console.log('Permissions:', permissions);
    console.log('Roles:', roles);
  }, [user, permissions, roles]);

  const userRole = useMemo(() => {
    if (user?.role) return user.role;
    if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0 ? decoded.roles[0] : null;
      } catch (e) {
        console.error('Token decode error:', e);
      }
    }
    return null;
  }, [user]);

  const hasViewUsers = useMemo(() => {
    const token = localStorage.getItem('token');
    let tokenHasAdmin = false;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        tokenHasAdmin = decoded.roles && decoded.roles.includes('Admin');
      } catch (e) {
        console.error('Token decode error:', e);
      }
    }
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['view_users'] === true;
  }, [userRole, permissions]);

  const columnsConfig = useMemo(() => [
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
          {params.value || ''}
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
          {params.value || ''}
        </Typography>
      ),
    },
    {
      field: 'username',
      headerName: 'User name (email)',
      flex: 1,
      minWidth: 200,
      visible: true,
    },
    {
      field: 'role',
      headerName: 'User Role',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['assign_roles'] === true,
      type: 'singleSelect',
      valueOptions: roles.map(role => role.value),
      valueGetter: (params) => params.row?.role || '',
      renderCell: (params) => params.row?.role || 'None',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['edit_users'] === true,
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
            disabled={!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['edit_users'] === true)}
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
            disabled={!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['delete_users'] === true)}
          >
            Actions
          </Button>
        </Box>
      ),
    },
  ], [permissions, userRole, roles]);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for permissions fetch');
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        setPermissionsLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token for permissions:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          setPermissionsLoading(false);
          return;
        }
        const response = await api.get('/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Permissions response:', response);
        setPermissions(response.data?.moduleData || { users: { access: {} }, clients: { access: {} }, employees: { access: {} } });
      } catch (err) {
        console.error('Fetch permissions error:', err, err.response?.data);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to load permissions', 'error');
          setPermissions({
            users: { access: { Admin: { view_users: true, edit_users: true, assign_roles: true, add_users: true, delete_users: true } } },
            clients: { access: { Admin: { view_clients: true, edit_clients: true } } },
            employees: { access: { Admin: { view_employees: true, edit_employees: true } } },
          });
        }
      } finally {
        setPermissionsLoading(false);
      }
    };
    fetchPermissions();
  }, [navigate, showSnackbar]);

  // Fetch users after permissions loaded
  useEffect(() => {
    if (permissionsLoading) return;

    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for users fetch');
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        return;
      }
      setLoading(true);
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token for users:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          return;
        }
        const response = await api.get('/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Users API response:', response);
        const data = response.data?.data || response.data || [];
        console.log('Fetched users data:', data);
        const formattedData = data.map((row) => ({
          ...row,
          username: row.username || row.email || '',
          created_at: row.created_at ? new Date(row.created_at * 1000) : null,
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
          role: row.role || '',
          name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || '',
        }));
        setUsers(formattedData);
        setError(null);
      } catch (error) {
        console.error('Fetch users error:', {
          message: error.message,
          response: error.response ? { status: error.response.status, data: error.response.data } : 'No response data',
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to fetch users, please try again', 'error');
          setError('Failed to fetch users');
        }
      } finally {
        setLoading(false);
      }
    };

    if (hasViewUsers) {
      setError(null);
      fetchUsers();
    } else {
      showSnackbar('Permission denied to view users', 'error');
      navigate('/dashboard', { replace: true });
    }
  }, [permissionsLoading, hasViewUsers, navigate, showSnackbar]);

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

  const getFilteredUsers = useMemo(() => {
    const searchFilter = (user) => {
      if (!filter) return true;
      const search = filter.toLowerCase().trim();
      return (
        user.last_name?.toLowerCase()?.includes(search) ||
        user.first_name?.toLowerCase()?.includes(search) ||
        user.username?.toLowerCase()?.includes(search) ||
        user.role?.toLowerCase()?.includes(search) ||
        user.status?.toLowerCase()?.includes(search) ||
        user.name?.toLowerCase()?.includes(search)
      );
    };
    return applyFilterRules(users, filterRules, searchFilter);
  }, [users, filterRules, filter]);

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
    if (!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['edit_users'] === true)) {
      showSnackbar('Permission denied to edit users', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      navigate('/login', { replace: true });
      return;
    }
    try {
      await usernameSchema.validate(updatedData.username);
    } catch (validationErr) {
      showSnackbar(validationErr.message, 'error');
      return;
    }
    try {
      console.log('Saving data:', updatedData);
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        showSnackbar('Session expired, please log in', 'error');
        navigate('/login', { replace: true });
        return;
      }
      const dataToSend = { ...updatedData, email: updatedData.username };
      const response = await api.put(`/users/${updatedData.uid}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API response:', response);
      let newData = response.data?.data || response.data;
      if (!newData) {
        throw new Error('No response data');
      }
      setUsers((prev) => prev.map((c) => (c.uid === newData.uid ? {
        ...newData,
        created_at: newData.created_at ? new Date(newData.created_at * 1000) : null,
        updated_at: newData.updated_at ? new Date(newData.updated_at) : null,
        name: newData.name || `${newData.first_name || ''} ${newData.last_name || ''}`.trim() || '',
      } : c)));
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
    if (!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['delete_users'] === true)) {
      showSnackbar('Permission denied to delete users', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || !userToDelete) {
      showSnackbar('No authentication token or user selected', 'error');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        showSnackbar('Session expired, please log in', 'error');
        navigate('/login', { replace: true });
        return;
      }
      await api.delete(`/users/${userToDelete.uid}`, {
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
    if (!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['edit_users'] === true)) {
      showSnackbar('Permission denied to edit users', 'error');
      return;
    }
    const { id, field, value } = params;
    const updatedUser = users.find((user) => user.uid === id);
    if (updatedUser && (field === 'status' || field === 'role')) {
      try {
        const token = localStorage.getItem('token');
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          return;
        }
        const updatedData = { ...updatedUser, [field]: value };
        const response = await api.put(`/users/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response.data?.data || response.data;
        if (!newData) {
          throw new Error('No response data');
        }
        setUsers((prev) => prev.map((c) => (c.uid === newData.uid ? {
          ...newData,
          created_at: newData.created_at ? new Date(newData.created_at * 1000) : null,
          updated_at: newData.updated_at ? new Date(newData.updated_at) : null,
          name: newData.name || `${newData.first_name || ''} ${newData.last_name || ''}`.trim() || '',
        } : c)));
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
    if (newRow.status !== oldRow.status || newRow.role !== oldRow.role) {
      handleCellEditCommit({ id: newRow.uid, field: 'status', value: newRow.status });
      if (newRow.role !== oldRow.role) {
        handleCellEditCommit({ id: newRow.uid, field: 'role', value: newRow.role });
      }
    }
    return updatedRow;
  };

  const handleNewUser = () => {
    if (!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['add_users'] === true)) {
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
    if (!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['add_users'] === true)) {
      showSnackbar('Permission denied to add users', 'error');
      return;
    }
    setAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        showSnackbar('Session expired, please log in', 'error');
        navigate('/login', { replace: true });
        return;
      }
      const response = await api.post('/users', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newData = response.data?.data || response.data;
      if (!newData) {
        throw new Error('No response data');
      }
      showSnackbar('User added successfully', 'success');
      setUsers((prev) => [...prev, {
        ...newData,
        created_at: newData.created_at ? new Date(newData.created_at * 1000) : null,
        updated_at: newData.updated_at ? new Date(newData.updated_at) : null,
        role: newData.role || '',
        name: newData.name || `${newData.first_name || ''} ${newData.last_name || ''}`.trim() || '',
      }]);
      setOpenAddDialog(false);
      setAddFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        status: 'Active',
        role: 'User',
        name: '',
      });
    } catch (err) {
      console.error('Add user error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add user', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  }

  if (rolesError) {
    showSnackbar(rolesError, 'error');
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">{rolesError}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Go to Dashboard
        </Button>
      </Box>
    );
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
                  disabled={!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['add_users'] === true)}
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
            <Box sx={{ height: 'calc(100% - 150px)', width: '100%' }}>
              {loading ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : users.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>
                  No users found
                </Typography>
              ) : (
                <DataGrid
                  rows={getFilteredUsers}
                  columns={columnsConfig.filter((col) => col.visible)}
                  getRowId={(row) => row.uid}
                  pageSizeOptions={[5, 10, 20, 100]}
                  onCellEditCommit={handleCellEditCommit}
                  processRowUpdate={processRowUpdate}
                  editMode="row"
                  sx={{
                    width: '100%',
                    ...tableStyles,
                    '& .MuiDataGrid-row': {
                      position: 'relative',
                    },
                  }}
                  disableSelectionOnClick
                />
              )}
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
                disabled={!(userRole?.toLowerCase() === 'admin' || permissions.users?.access[userRole]?.['delete_users'] === true)}
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
            <TableFilterDialog
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              columnsConfig={columnsConfig}
              filterRules={filterRules}
              setFilterRules={setFilterRules}
              onClose={handleFilterClose}
              onFilterClick={handleAddRule}
            />
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
            label="Display Name"
            name="name"
            value={addFormData.name}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="User name (email)"
            name="username"
            value={addFormData.username}
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