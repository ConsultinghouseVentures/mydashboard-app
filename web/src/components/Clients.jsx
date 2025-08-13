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
import TableLightbox from './TableLightbox';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';
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

const Clients = () => {
  const { dialogStyle, lightboxStyles, tableStyles, isSidebarCollapsed } = useContext(LayoutContext) || {};
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [permissions, setPermissions] = useState({ clients: { access: {} } });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [savedViews, setSavedViews] = useState(() => JSON.parse(localStorage.getItem('clientViews')) || []);
  const [selectedView, setSelectedView] = useState('');
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [lightboxMode, setLightboxMode] = useState('view');
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [addFormData, setAddFormData] = useState({
    client_name: '',
    status: 'Active',
    incorporation_date: '',
    company_form: '',
    industry: '',
    business_purpose: '',
    num_employees: '',
    annual_revenue: '',
    home_country: '',
    address_street: '',
    address_postal_code: '',
    address_locality: '',
    address_country: '',
    managing_director: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    remarks: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state for data fetch
  const [columnsConfig, setColumnsConfig] = useState([
    {
      field: 'client_name',
      headerName: 'Client Name',
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
            navigate(`/clients/${params.row.uid}`);
          }}
        >
          {params?.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: permissions.clients?.access[user?.role]?.['edit_clients'] ?? false,
      type: 'singleSelect',
      valueOptions: ['Active', 'Inactive'],
    },
    {
      field: 'incorporation_date',
      headerName: 'Incorporation Date',
      flex: 1,
      minWidth: 150,
      visible: true,
      type: 'date',
    },
    {
      field: 'company_form',
      headerName: 'Company Form',
      flex: 1,
      minWidth: 150,
      visible: true,
    },
    {
      field: 'industry',
      headerName: 'Industry',
      flex: 1,
      minWidth: 150,
      visible: true,
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
              setSelectedClient(params.row);
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
              setSelectedClient(params.row);
              setLightboxMode('edit');
            }}
            disabled={!(permissions.clients?.access[user?.role]?.['edit_clients'] ?? false)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setActionsAnchorEl(event.currentTarget);
              setClientToDelete(params.row);
            }}
            disabled={!(permissions.clients?.access[user?.role]?.['delete_clients'] ?? false)}
          >
            Actions
          </Button>
        </Box>
      ),
    },
  ]);

  const [filterRules, setFilterRules] = useState(() => {
    try {
      const rules = JSON.parse(localStorage.getItem('clientFilterRules')) || [];
      console.log('Initial filterRules from localStorage:', rules);
      return rules;
    } catch (e) {
      console.error('Error parsing clientFilterRules from localStorage:', e);
      return [];
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [openViewsDialog, setOpenViewsDialog] = useState(false);

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

  const hasViewClients = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.clients?.access[userRole]?.['view_clients'] === true;
  }, [userRole, permissions]);

  const hasEditClients = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.clients?.access[userRole]?.['edit_clients'] === true;
  }, [userRole, permissions]);

  const hasDeleteClients = useMemo(() => {
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
    return tokenHasAdmin || userRole?.toLowerCase() === 'admin' || permissions.clients?.access[userRole]?.['delete_clients'] === true;
  }, [userRole, permissions]);

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
        console.log('Permissions response:', response);
        setPermissions(response.data?.moduleData || response.moduleData || { clients: { access: {} } }); // Adjusted for data structure
      } catch (err) {
        console.error('Fetch permissions error:', err, err.response?.data);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to load permissions', 'error');
          setPermissions({ clients: { access: { Admin: { view_clients: true, edit_clients: true, delete_clients: true } } } }); // Default on error
        }
      }
    };
    fetchPermissions();
  }, [navigate, showSnackbar]);

  // Fetch clients
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
        const decoded = jwtDecode(token);
        console.log('Decoded token for data:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          return;
        }
        const clientsResponse = await api.get('/clients', { headers: { Authorization: `Bearer ${token}` } });

        console.log('Clients API full response:', clientsResponse);
        const clientsData = Array.isArray(clientsResponse.data.data) ? clientsResponse.data.data : Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        console.log('Clients API response data:', clientsData);
        const formattedData = clientsData.map((row) => ({
          ...row,
          created_at: row.created_at ? new Date(row.created_at * 1000) : null,
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
        }));
        console.log('Setting clients:', formattedData);
        setClients(formattedData);

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
          setError('Permission denied to access clients');
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
    if (hasViewClients) {
      fetchData();
    } else {
      setError('Permission denied to view clients');
      setLoading(false);
    }
  }, [navigate, user?.role, permissions, hasViewClients, showSnackbar]);

  useEffect(() => {
    localStorage.setItem('clientViews', JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    localStorage.setItem('clientFilterRules', JSON.stringify(filterRules));
  }, [filterRules]);

  const handleColumnToggle = (field) => {
    setColumnsConfig(columnsConfig.map((col) =>
      col.field === field ? { ...col, visible: !col.visible } : col
    ));
  };

  const getFilteredClients = useMemo(() => {
    const searchFilter = (client) => {
      if (!filter) return true;
      const search = filter.toLowerCase().trim();
      return (
        client.client_name?.toLowerCase().includes(search) ||
        client.status?.toLowerCase().includes(search) ||
        client.company_form?.toLowerCase().includes(search) ||
        client.industry?.toLowerCase().includes(search)
      );
    };
    return applyFilterRules(clients, filterRules, searchFilter);
  }, [clients, filterRules, filter]); // Memoized for performance

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
    if (!hasEditClients) {
      showSnackbar('Permission denied to edit clients', 'error');
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
      const response = await api.put(`/clients/${updatedData.uid}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API response:', response);
      const newData = response.data.data || response.data;
      if (!newData || !newData.uid) {
        throw new Error('Invalid response data');
      }
      setClients((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
      setSelectedClient(null);
      showSnackbar('Client updated successfully', 'success');
      return newData;
    } catch (err) {
      console.error('Update error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update client', 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!hasDeleteClients) {
      showSnackbar('Permission denied to delete clients', 'error');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || !clientToDelete) {
      showSnackbar('No authentication token or client selected', 'error');
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
      await api.delete(`/clients/${clientToDelete.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) => prev.filter((e) => e.uid !== clientToDelete.uid));
      showSnackbar('Client deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to delete client', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setClientToDelete(null);
      setActionsAnchorEl(null);
    }
  };

  const handleCellEditCommit = async (params) => {
    if (!hasEditClients) {
      showSnackbar('Permission denied to edit clients', 'error');
      return params.value; // Return original value
    }
    const { id, field, value } = params;
    const updatedClient = clients.find((client) => client.uid === id);
    if (updatedClient) {
      const updatedData = { ...updatedClient, [field]: value };
      try {
        const token = localStorage.getItem('token');
        const response = await api.put(`/clients/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response.data.data || response.data;
        setClients((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
        showSnackbar('Client updated successfully', 'success');
        return value; // Return new value
      } catch (err) {
        console.error('Inline edit error:', err);
        showSnackbar(err.response?.data?.message || 'Failed to update client', 'error');
        return updatedClient[field]; // Revert to old value
      }
    }
    return params.value;
  };

  const handleNewClient = () => {
    if (!hasEditClients) {
      showSnackbar('Permission denied to add clients', 'error');
      return;
    }
    setOpenAddDialog(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async () => {
    if (!hasEditClients) {
      showSnackbar('Permission denied to add clients', 'error');
      return;
    }
    // Basic validation
    if (!addFormData.client_name) {
      showSnackbar('Missing required field: Client Name', 'error');
      return;
    }
    setAddLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/clients', addFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Client added successfully', 'success');
      setClients((prev) => [...prev, response.data.data || response.data]);
      setOpenAddDialog(false);
      setAddFormData({
        client_name: '',
        status: 'Active',
        incorporation_date: '',
        company_form: '',
        industry: '',
        business_purpose: '',
        num_employees: '',
        annual_revenue: '',
        home_country: '',
        address_street: '',
        address_postal_code: '',
        address_locality: '',
        address_country: '',
        managing_director: '',
        phone: '',
        fax: '',
        email: '',
        website: '',
        remarks: '',
      });
    } catch (err) {
      console.error('Add client error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add client', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  console.log('Clients state:', clients);
  console.log('Filter:', filter);
  console.log('Filter rules:', filterRules);
  console.log('Filtered clients:', getFilteredClients);

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
                Clients
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right', maxWidth: '100%' }}>
                <SearchBox value={filter} onChange={setFilter} onClear={setFilter} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewClient}
                  disabled={!hasEditClients}
                >
                  New Client
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
                  rows={getFilteredClients}
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
            <TableLightbox
              open={!!selectedClient}
              mode={lightboxMode}
              data={selectedClient}
              columnsConfig={columnsConfig}
              onClose={() => setSelectedClient(null)}
              onSave={handleSaveEdit}
            />
          </ErrorBoundary>
        </Box>
      </Box>
      <LayoutLightbox open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle sx={lightboxStyles ? lightboxStyles.title : { p: 1, fontSize: '1rem' }}>
          Add New Client
        </DialogTitle>
        <DialogContent sx={lightboxStyles ? lightboxStyles.content : { p: 1 }}>
          <TextField
            label="Client Name"
            name="client_name"
            value={addFormData.client_name}
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
          <TextField
            label="Incorporation Date"
            name="incorporation_date"
            type="date"
            value={addFormData.incorporation_date}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Company Form"
            name="company_form"
            value={addFormData.company_form}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Industry"
            name="industry"
            value={addFormData.industry}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Business Purpose"
            name="business_purpose"
            value={addFormData.business_purpose}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Number of Employees"
            name="num_employees"
            value={addFormData.num_employees}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Annual Revenue"
            name="annual_revenue"
            value={addFormData.annual_revenue}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Home Country"
            name="home_country"
            value={addFormData.home_country}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Street Address"
            name="address_street"
            value={addFormData.address_street}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Postal Code"
            name="address_postal_code"
            value={addFormData.address_postal_code}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Locality"
            name="address_locality"
            value={addFormData.address_locality}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Country"
            name="address_country"
            value={addFormData.address_country}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Managing Director"
            name="managing_director"
            value={addFormData.managing_director}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Phone"
            name="phone"
            value={addFormData.phone}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Fax"
            name="fax"
            value={addFormData.fax}
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
            type="email"
          />
          <TextField
            label="Website"
            name="website"
            value={addFormData.website}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Remarks"
            name="remarks"
            value={addFormData.remarks}
            onChange={handleAddChange}
            fullWidth
            margin="normal"
            multiline
          />
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
          <Typography>Do you want to delete this client?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>No</Button>
          <Button onClick={handleDelete} color="error">Yes</Button>
        </DialogActions>
      </Dialog>
    </LayoutTableOverview>
  );
};

export default Clients;