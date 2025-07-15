// Clients.jsx

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import { FilterAlt as FilterIcon, Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../services/api';
import TableFilterDialog, { applyFilterRules } from './TableFilterDialog';
import SearchBox from './SearchBox';
import SavedViews from './SavedViews';
import LayoutLightbox from './Layout_Lightbox.jsx';
import TableLightbox from './TableLightbox';

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
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const [savedViews, setSavedViews] = useState(() => JSON.parse(localStorage.getItem('clientViews')) || []);
  const [selectedView, setSelectedView] = useState('');
  const [openColumnDialog, setOpenColumnDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [lightboxMode, setLightboxMode] = useState('view');
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
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      visible: true,
      editable: true,
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
          >
            Edit
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem('token');
      console.log('Clients fetch token:', token);
      if (!token) {
        console.log('No token, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const response = await api.get('/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Clients API full response:', response);
        // Handle case where response is the data array directly
        const data = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
        console.log('Clients API response data:', data);
        const formattedData = data.map((row) => ({
          ...row,
          created_at: row.created_at ? new Date(row.created_at) : null,
          updated_at: row.updated_at ? new Date(row.updated_at) : null,
        }));
        console.log('Setting clients:', formattedData);
        setClients(formattedData);
        setError(null);
      } catch (error) {
        console.error('Fetch clients error:', {
          message: error.message,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : 'No response data',
        });
        setError(error.response?.data?.message || 'Failed to fetch clients');
        if (error.response?.status === 401) {
          console.log('Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      }
    };
    fetchClients();
  }, [navigate]);

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

  const getFilteredClients = () => {
    const searchFilter = (client) => {
      if (!filter) return true;
      const search = filter.toLowerCase().trim();
      return (
        client.client_name?.toLowerCase().includes(search) ||
        client.status?.toLowerCase().includes(search)
      );
    };
    return applyFilterRules(clients, filterRules, searchFilter);
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

  const handleViewsDialogOpen = () => {
    setOpenViewsDialog(true);
  };

  const handleViewsDialogClose = () => {
    setOpenViewsDialog(false);
  };

  const handleSaveEdit = async (updatedData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }
    try {
      console.log('Saving data:', updatedData);
      const response = await api.put(`/api/clients/${updatedData.uid}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API response:', response);
      const newData = response; // Assuming response contains the updated object
      setClients((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
      setSelectedClient(newData); // Update lightbox with new data
      return newData; // Return updated data for lightbox
    } catch (err) {
      console.error('Update error:', err);
      throw err; // Propagate error to lightbox
    }
  };

  const handleCellEditCommit = async (params) => {
    const { id, field, value } = params;
    const updatedClient = clients.find((client) => client.uid === id);
    if (updatedClient && field === 'status') {
      const updatedData = { ...updatedClient, [field]: value };
      try {
        const token = localStorage.getItem('token');
        const response = await api.put(`/api/clients/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = response;
        setClients((prev) => prev.map((c) => (c.uid === newData.uid ? newData : c)));
      } catch (err) {
        console.error('Inline edit error:', err);
        // Revert to original value on failure
        setClients((prev) => prev.map((c) => (c.uid === id ? { ...c, status: updatedClient.status } : c)));
      }
    }
  };

  const processRowUpdate = (newRow, oldRow) => {
    const updatedRow = { ...newRow };
    if (newRow.status !== oldRow.status) {
      handleCellEditCommit({ id: newRow.uid, field: 'status', value: newRow.status });
    }
    return updatedRow;
  };

  const handleNewClient = () => {
    console.log('New client button clicked');
    // Placeholder for future implementation (e.g., navigate to new client form)
  };

  const filteredClients = getFilteredClients();

  console.log('Clients state:', clients);
  console.log('Filter:', filter);
  console.log('Filter rules:', filterRules);
  console.log('Filtered clients:', filteredClients);

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
                Clients
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end', textAlign: 'right', maxWidth: '100%' }}>
                <SearchBox value={filter} onChange={setFilter} onClear={setFilter} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewClient}
                >
                  New Client
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
            <Box sx={{ width: '100%', overflowX: 'auto', maxWidth: '100%', minWidth: '800px', boxSizing: 'border-box' }}>
              <DataGrid
                rows={filteredClients}
                columns={columnsConfig.filter((col) => col.visible)} // Only display visible columns
                getRowId={(row) => row.uid}
                autoHeight
                pageSizeOptions={[5, 10, 20, 100]}
                onCellEditCommit={handleCellEditCommit}
                processRowUpdate={processRowUpdate}
                editMode="cell"
                experimentalFeatures={{ newEditingApi: true }}
                sx={{
                  ...tableStyles,
                  '& .MuiDataGrid-row': {
                    position: 'relative',
                  },
                }}
                disableSelectionOnClick
              />
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
                onFilterClick={handleFilterClick}
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
    </LayoutTableOverview>
  );
};

export default Clients;