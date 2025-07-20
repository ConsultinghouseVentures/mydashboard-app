// src/components/Employees.jsx
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
} from '@mui/material';
import { FilterAlt as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import TableFilterDialog, { applyFilterRules } from './TableFilterDialog';
import SearchBox from './SearchBox';
import SavedViews from './SavedViews';
import LayoutLightbox from './Layout_Lightbox';
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

const Employees = () => {
  const { dialogStyle, lightboxStyles, tableStyles, isSidebarCollapsed } = useContext(LayoutContext) || {};
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const navigate = useNavigate();
  const { roles: roleList, loading: rolesLoading, error: rolesError } = useUserRoles(); // Destructure to fix TypeError
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
  const [loading, setLoading] = useState(true); // Added loading state for data fetch
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
            navigate(`/employees/${params.id}`);
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
            navigate(`/employees/${params.id}`);
          }}
        >
          {params?.value}
        </Typography>
      ),
    },
    {
      field: 'client_id',
      headerName: 'Client',
      flex: 1,
      minWidth: 150,
      visible: true,
      editable: permissions.employees?.access[user?.role]?.['write:employees'] ?? false,
      type: 'singleSelect',
      valueOptions: () => clients.map(c => ({ value: c.uid, label: c.name })),
      renderCell: (params) => params?.row?.client ? params.row.client.name : 'None',
      valueGetter: (params) => params?.row?.client_id || null,
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
      editable: permissions.employees?.access[user?.role]?.['write:employees'] ?? false,
      type: 'singleSelect',
      valueOptions: () => roleList.map(role => role.value), // Made function for dynamic update after fetch
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: permissions.employees?.access[user?.role]?.['write:employees'] ?? false,
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
      width: 150,
      sortable: false,
      filterable: false,
      visible: true,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'none',
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            '& .MuiButton-root': { m: 0.5 },
            '.MuiDataGrid-row:hover &': {
              display: 'flex',
            },
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedEmployee(params?.row);
              setLightboxMode('view');
            }}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!(permissions.employees?.access[user?.role]?.['write:employees'] ?? false)}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedEmployee(params?.row);
              setLightboxMode('edit');
            }}
          >
            Edit
          </Button>
        </Box>
      ),
    },
  ]);

  const [filterRules, setFilterRules] = useState(() => {
    try {
      const rules = JSON.parse(localStorage.getItem('employeeFilterRules')) || [];
      console.log('Initial filterRules from localStorage:', rules);
      return rules;
    } catch (e) {
      console.error('Error parsing employeeFilterRules from localStorage:', e);
      return [];
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openViewsDialog, setOpenViewsDialog] = useState(false);

  // Fetch permissions to determine access
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
        setPermissions(response?.moduleData || { employees: { access: {} } }); // Fixed TypeError with optional chaining and default
      } catch (err) {
        console.error('Fetch permissions error:', err);
        setError('Failed to load permissions');
        setPermissions({ employees: { access: {} } }); // Default on error
      }
    };
    fetchPermissions();
  }, [navigate]);

  // Fetch employees and clients
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      setLoading(true); // Start loading
      try {
        const [employeesResponse, clientsResponse] = await Promise.all([
          api.get('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        console.log('Employees API full response:', employeesResponse);
        const employeesData = Array.isArray(employeesResponse.data) ? employeesResponse.data : [];
        console.log('Employees API response data:', employeesData);
        const formattedData = employeesData.map((row) => ({
          ...row,
          created_at: row.created_at ? new Date(row.created_at) : null,
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
        }));
        console.log('Setting employees:', formattedData);
        setEmployees(formattedData);

        setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);

        setError(null);
      } catch (error) {
        console.error('Fetch data error:', {
          message: error.message,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : 'No response data',
        });
        if (error.response?.status === 403) {
          setError('Permission denied to access employees');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch data');
        }
        if (error.response?.status === 401) {
          console.log('Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false); // End loading
      }
    };
    if (permissions.employees?.access[user?.role]?.['read:employees'] === true) {
      fetchData();
    } else {
      setError('Permission denied to view employees');
      setLoading(false);
    }
  }, [navigate, user?.role, permissions]);

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
        employee.client?.name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.role?.toLowerCase().includes(search) ||
        employee.status?.toLowerCase().includes(search)
      );
    };
    return applyFilterRules(employees, filterRules, searchFilter);
  }, [employees, filterRules, filter]); // Memoized for performance

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
    if (!(permissions.employees?.access[user?.role]?.['write:employees'] ?? false)) {
      showSnackbar('Permission denied to edit employees', 'error');
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
      const response = await api.put(`/api/employees/${updatedData.uid}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API response:', response);
      const newData = response.data;
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

  const handleCellEditCommit = async (params) => {
    if (!(permissions.employees?.access[user?.role]?.['write:employees'] ?? false)) {
      showSnackbar('Permission denied to edit employees', 'error');
      return params.value; // Return original value
    }
    const { id, field, value } = params;
    const updatedEmployee = employees.find((employee) => employee.uid === id);
    if (updatedEmployee) {
      const updatedData = { ...updatedEmployee, [field]: value };
      try {
        const token = localStorage.getItem('token');
        const response = await api.put(`/api/employees/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response.data;
        setEmployees((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
        showSnackbar('Employee updated successfully', 'success');
        return value; // Return new value
      } catch (err) {
        console.error('Inline edit error:', err);
        showSnackbar(err.response?.data?.message || 'Failed to update employee', 'error');
        return updatedEmployee[field]; // Revert to old value
      }
    }
    return params.value;
  };

  // Removed processRowUpdate as editMode is 'cell', not 'row'
  // Updated to use onCellEditStop or similar if needed, but onCellEditCommit handles it

  const handleNewEmployee = () => {
    if (!(permissions.employees?.access[user?.role]?.['add:employees'] ?? false)) {
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
    if (!(permissions.employees?.access[user?.role]?.['add:employees'] ?? false)) {
      showSnackbar('Permission denied to add employees', 'error');
      return;
    }
    // Basic validation
    if (!addFormData.first_name || !addFormData.last_name || !addFormData.email || !addFormData.password) {
      showSnackbar('Missing required fields: First Name, Last Name, Email, Password', 'error');
      return;
    }
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(addFormData.email)) {
      showSnackbar('Invalid email format', 'error');
      return;
    }
    setAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/api/employees', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Employee added successfully', 'success');
      setEmployees((prev) => [...prev, response.data]);
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

  console.log('Employees state:', employees);
  console.log('Filter:', filter);
  console.log('Filter rules:', filterRules);
  console.log('Filtered employees:', getFilteredEmployees);

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
                Employees
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right', maxWidth: '100%' }}>
                <SearchBox value={filter} onChange={setFilter} onClear={setFilter} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewEmployee}
                  disabled={!(permissions.employees?.access[user?.role]?.['add:employees'] ?? false)}
                >
                  New Employee
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
            <Box sx={{ height: 400, width: '100%', overflowX: 'auto', maxWidth: '100%', minWidth: '800px', boxSizing: 'border-box' }}> {/* Fixed Data Grid height warning by setting explicit height on parent Box */}
              {loading ? (
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
              ) : (
                <DataGrid
                  rows={getFilteredEmployees}
                  columns={columnsConfig.filter((col) => col.visible)}
                  getRowId={(row) => row.uid}
                  autoHeight
                  pageSizeOptions={[5, 10, 20, 100]}
                  onCellEditCommit={handleCellEditCommit}
                  editMode="cell"
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
            <TableLightbox
              open={!!selectedEmployee}
              mode={lightboxMode}
              data={selectedEmployee}
              columnsConfig={columnsConfig}
              onClose={() => setSelectedEmployee(null)}
              onSave={handleSaveEdit}
            />
          </ErrorBoundary>
        </Box>
      </Box>
      <LayoutLightbox open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem' }}>
          Add New Employee
        </DialogTitle>
        <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
          <TextField
            label="First Name"
            name="first_name"
            value={addFormData.first_name}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Last Name"
            name="last_name"
            value={addFormData.last_name}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            value={addFormData.email}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            required
            type="email"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={addFormData.password}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select name="status" value={addFormData.status} onChange={handleAddChange}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Client</InputLabel>
            <Select name="client_id" value={addFormData.client_id} onChange={handleAddChange}>
              <MenuItem value="">None</MenuItem>
              {clients.map((client) => (
                <MenuItem key={client.uid} value={client.uid}>
                  {client.name}
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

export default Employees;