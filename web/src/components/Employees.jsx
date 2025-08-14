// Path: src/components/Employees.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTableOverview, LayoutContext } from './Layout_TableOverview.jsx';
import {
  Typography,
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Menu,
  Dialog,
} from '@mui/material';
import { FilterAlt as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import TableFilterDialog, { applyFilterRules } from './TableFilterDialog';
import SearchBox from './SearchBox';
import SavedViews from './SavedViews';
import LayoutLightbox from './Layout_Lightbox';
import EditEmployeeLightbox from './EditEmployeeLightbox';
import AddEmployeeForm from './AddEmployeeForm';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';
import { useUserRoles } from '../constants/roles';
import jwtDecode from 'jwt-decode';
import '../styles/styles_tables.css';

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

const Employees = () => {
  const { dialogStyle, lightboxStyles, tableStyles, isSidebarCollapsed } = useContext(LayoutContext) || {};
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const navigate = useNavigate();
  const { roles: roleList, loading: rolesLoading, error: rolesError } = useUserRoles();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [permissions, setPermissions] = useState({ employees: { access: {} } });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [savedViews, setSavedViews] = useState(() => JSON.parse(localStorage.getItem('employeeViews')) || []);
  const [selectedView, setSelectedView] = useState('');
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [lightboxMode, setLightboxMode] = useState('view');
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addFormData, setAddFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    status: 'Active',
    role: 'Employee',
    client_id: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterRules, setFilterRules] = useState(() => {
    try {
      const rules = JSON.parse(localStorage.getItem('employeeFilterRules')) || [];
      return rules;
    } catch (e) {
      console.error('Error parsing employeeFilterRules from localStorage:', e);
      return [];
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openViewsDialog, setOpenViewsDialog] = useState(false);

  const userRole = useMemo(() => {
    console.log('User object:', user);
    if (user?.role) return user.role;
    if (user?.roles && Array.isArray(user.roles) && user.roles.length > 0) return user.roles[0];
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        return decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0 ? decoded.roles[0] : null;
      } catch (e) {
        console.error('Token decode error:', e);
      }
    }
    return null;
  }, [user]);

  const hasViewEmployees = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.employees?.access[userRole]?.['view_employees'] === true;
  }, [userRole, permissions]);

  const hasEditEmployees = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.employees?.access[userRole]?.['edit_employees'] === true;
  }, [userRole, permissions]);

  const hasDeleteEmployees = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.employees?.access[userRole]?.['delete_employees'] === true;
  }, [userRole, permissions]);

  useEffect(() => {
    const fetchPermissions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token for permissions:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          return;
        }
        const response = await api.get('/permissions/permissions-matrix', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Permissions response:', response.data);
        const permissionsData = response.data?.moduleData || response.data || {
          employees: {
            access: {
              Admin: { view_employees: true, edit_employees: true, delete_employees: true },
              [userRole || 'default']: { view_employees: true, edit_employees: true, delete_employees: true },
            },
          },
        };
        setPermissions(permissionsData);
      } catch (err) {
        console.error('Fetch permissions error:', err, err.response?.data);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to load permissions', 'error');
          setPermissions({
            employees: {
              access: {
                Admin: { view_employees: true, edit_employees: true, delete_employees: true },
                [userRole || 'default']: { view_employees: true, edit_employees: true, delete_employees: true },
              },
            },
          });
        }
      }
    };
    fetchPermissions();
  }, [navigate, showSnackbar, userRole]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      setLoading(true);
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token for data:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          return;
        }
        const [employeesResponse, clientsResponse] = await Promise.all([
          api.get('/employees', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/clients', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const employeesData = Array.isArray(employeesResponse.data.data) ? employeesResponse.data.data : Array.isArray(employeesResponse.data) ? employeesResponse.data : [];
        const formattedData = employeesData.map((row) => ({
          ...row,
          created_at: row.created_at ? new Date(row.created_at * 1000) : null,
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
        }));
        setEmployees(formattedData);

        const clientsData = Array.isArray(clientsResponse.data.data) ? clientsResponse.data.data : Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        setClients(clientsData);

        setError(null);
      } catch (error) {
        console.error('Fetch data error:', {
          message: error.message,
          response: error.response ? { status: error.response.status, data: error.response.data } : 'No response data',
        });
        if (error.response?.status === 403) {
          setError('Permission denied to access employees');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch data');
        }
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    if (hasViewEmployees) {
      fetchData();
    } else {
      setError('Permission denied to view employees');
      setLoading(false);
    }
  }, [navigate, user?.role, permissions, hasViewEmployees, showSnackbar]);

  useEffect(() => {
    localStorage.setItem('employeeViews', JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem('employeeFilterRules', JSON.stringify(filterRules));
  }, [filterRules]);

  const handleColumnToggle = (field) => {
    setColumnsConfig(columnsConfig.map((col) =>
      col.field === field ? { ...col, visible: !col.visible } : col
    ));
  };

  const getFilteredEmployees = useMemo(() => {
    const searchFilter = (employee) => {
      if (!filter) return true;
      const search = filter.toLowerCase().trim();
      return (
        employee.last_name?.toLowerCase().includes(search) ||
        employee.first_name?.toLowerCase().includes(search) ||
        employee.client_name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.role?.toLowerCase().includes(search) ||
        employee.status?.toLowerCase().includes(search)
      );
    };
    return applyFilterRules(employees, filterRules, searchFilter);
  }, [employees, filterRules, filter]);

  const handleFilterClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleFilterClose = () => {
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
    if (!hasEditEmployees) {
      showSnackbar('Permission denied to edit employees', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      return;
    }
    try {
      const response = await api.put(`/employees/${updatedData.uid}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newData = response.data.data || response.data;
      if (!newData || !newData.uid) {
        throw new Error('Invalid response data');
      }
      setEmployees((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
      setSelectedEmployee(null);
      showSnackbar('Employee updated successfully', 'success');
      return newData;
    } catch (err) {
      console.error('Update error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update employee', 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!hasDeleteEmployees) {
      showSnackbar('Permission denied to delete employees', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || !employeeToDelete) {
      showSnackbar('No authentication token or employee selected', 'error');
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
      await api.delete(`/employees/${employeeToDelete.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees((prev) => prev.filter((e) => e.uid !== employeeToDelete.uid));
      showSnackbar('Employee deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setEmployeeToDelete(null);
      setActionsAnchorEl(null);
    }
  };

  const handleCellEditCommit = async (params) => {
    if (!hasEditEmployees) {
      showSnackbar('Permission denied to edit employees', 'error');
      return params.value;
    }
    const { id, field, value } = params;
    const updatedEmployee = employees.find((employee) => employee.uid === id);
    if (updatedEmployee) {
      const updatedData = { ...updatedEmployee, [field]: value };
      try {
        const token = localStorage.getItem('token');
        const response = await api.put(`/employees/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response.data.data || response.data;
        setEmployees((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
        showSnackbar('Employee updated successfully', 'success');
        return value;
      } catch (err) {
        console.error('Inline edit error:', err);
        showSnackbar(err.response?.data?.message || 'Failed to update employee', 'error');
        return updatedEmployee[field];
      }
    }
    return params.value;
  };

  const handleNewEmployee = () => {
    if (!hasEditEmployees) {
      showSnackbar('Permission denied to add employees', 'error');
      return;
    }
    setOpenAddDialog(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async () => {
    if (!hasEditEmployees) {
      showSnackbar('Permission denied to add employees', 'error');
      return;
    }
    if (!addFormData.first_name || !addFormData.last_name || !addFormData.email || !addFormData.password) {
      showSnackbar('Missing required fields: First Name, Last Name, Email, Password', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(addFormData.email)) {
      showSnackbar('Invalid email format', 'error');
      return;
    }
    setAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/employees', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Employee added successfully', 'success');
      setEmployees((prev) => [...prev, response.data.data || response.data]);
      setOpenAddDialog(false);
      setAddFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        status: 'Active',
        role: 'Employee',
        client_id: '',
      });
    } catch (err) {
      console.error('Add employee error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add employee', 'error');
    } finally {
      setAddLoading(false);
    }
  };

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
            navigate(`/employees/${params.row.uid}`);
          }}
        >
          {params?.value}
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
            navigate(`/employees/${params.row.uid}`);
          }}
        >
          {params?.value}
        </Typography>
      ),
    },
    {
      field: 'client_name',
      headerName: 'Client',
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
            if (params.row.client_id) navigate(`/clients/${params.row.client_id}`);
          }}
        >
          {params.value || 'None'}
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
      field: 'role',
      headerName: 'User Role',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: hasEditEmployees,
      type: 'singleSelect',
      valueOptions: () => roleList.map(role => role.value),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: hasEditEmployees,
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
            '& .MuiButton-root': { m: 0.5, minWidth: '70px', zIndex: 1 },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              console.log('Preview button clicked for row:', params.row);
              event.stopPropagation();
              setSelectedEmployee(params.row);
              setLightboxMode('view');
            }}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              console.log('Edit button clicked for row:', params.row);
              event.stopPropagation();
              setSelectedEmployee(params.row);
              setLightboxMode('edit');
            }}
            disabled={!hasEditEmployees}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              console.log('Actions button clicked for row:', params.row);
              event.stopPropagation();
              setActionsAnchorEl(event.currentTarget);
              setEmployeeToDelete(params.row);
            }}
            disabled={!hasDeleteEmployees}
          >
            Actions
          </Button>
        </Box>
      ),
    },
  ]);

  console.log('User Role:', userRole);
  console.log('Permissions:', permissions);
  console.log('Employees state:', employees);
  console.log('Filter:', filter);
  console.log('Filter rules:', filterRules);
  console.log('Filtered employees:', getFilteredEmployees);

  return (
    <LayoutTableOverview showBackTop={true} showBackBottom={true}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', position: 'relative', overflowX: 'auto' }}>
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
            ml: isSidebarCollapsed ? '-50px' : 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 8, maxWidth: '100%' }}>
              <Typography variant="h4" component="h1" sx={{ ml: 0, textAlign: 'left' }}>
                Employees
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right', maxWidth: '100%' }}>
                <SearchBox value={filter} onChange={setFilter} onClear={setFilter} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewEmployee}
                  disabled={!hasEditEmployees}
                >
                  New Employee
                </Button>
              </Box>
            </Box>
            <Box sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, width: '100%', maxWidth: '100%' }}>
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
              ) : (
                <DataGrid
                  rows={getFilteredEmployees}
                  columns={columnsConfig.filter((col) => col.visible)}
                  getRowId={(row) => row.uid}
                  pageSizeOptions={[5, 10, 20, 100]}
                  onCellEditCommit={handleCellEditCommit}
                  editMode="cell"
                  className="custom-data-grid"
                  sx={{
                    ...tableStyles,
                    '& .MuiDataGrid-row': {
                      position: 'relative',
                    },
                  }}
                  disableSelectionOnClick
                />
              )}
            </Box>
          </Box>
          <ErrorBoundary>
            {columnsConfig.length > 0 && filterRules && (
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
            <EditEmployeeLightbox
              open={!!selectedEmployee}
              mode={lightboxMode}
              data={selectedEmployee}
              clients={clients}
              onClose={() => setSelectedEmployee(null)}
              onSave={handleSaveEdit}
              lightboxStyles={lightboxStyles}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <AddEmployeeForm
              open={openAddDialog}
              onClose={() => setOpenAddDialog(false)}
              formData={addFormData}
              onChange={handleAddChange}
              onSubmit={handleAddSubmit}
              loading={addLoading}
              clients={clients}
            />
          </ErrorBoundary>
        </Box>
      </Box>
      <Menu
        anchorEl={actionsAnchorEl}
        open={Boolean(actionsAnchorEl)}
        onClose={() => setActionsAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setOpenDeleteDialog(true);
          setActionsAnchorEl(null);
        }}>
          Delete
        </MenuItem>
      </Menu>
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Do you want to delete this employee?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>No</Button>
          <Button onClick={handleDelete} color="error">Yes</Button>
        </DialogActions>
      </Dialog>
    </LayoutTableOverview>
  );
};

export default Employees;