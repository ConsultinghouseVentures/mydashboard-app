// Path: src/components/Clients.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, Paper, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import useClientData from '../hooks/useClientData';
import DataTable from './DataTable';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';

const Clients = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useUser();
  const [clientId, setClientId] = useState(user?.client_id || null);
  const { clients, isLoading, error } = useClientData(clientId);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
    }
  }, [error, showSnackbar]);

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error && !clients.length) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Clients ({clients.length})</Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/clients/new')}
            disabled={!user?.permissions?.includes('add_clients')}
          >
            Add Client
          </Button>
        </Box>
        <DataTable
          columns={[
            { field: 'client_name', headerName: 'Client Name', width: 200 },
            { field: 'email', headerName: 'Email', width: 200 },
            { field: 'phone', headerName: 'Phone', width: 150 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 100,
              renderCell: (params) => (
                <Button
                  onClick={() => navigate(`/clients/${params.row.uid}`)}
                  variant="outlined"
                  size="small"
                  disabled={!user?.permissions?.includes('view_clients')}
                >
                  View
                </Button>
              ),
            },
          ]}
          data={clients.map((client) => ({
            ...client,
            client_name: client.client_name || 'Unknown',
            email: client.email || '',
            phone: client.phone || '',
          }))}
        />
      </Paper>
    </Box>
  );
};

export default Clients;