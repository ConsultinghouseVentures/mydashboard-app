// src/components/Clients.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, Paper, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import useClientData from '../hooks/useClientData'; // Default import
import DataTable from './DataTable';
import { useSnackbar } from '../context/SnackbarContext';

const Clients = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [clientId, setClientId] = useState(null); // Initialize clientId state
  const { clients, isLoading, error } = useClientData(clientId); // Use clientId with useClientData

  // Fetch clientId from auth context or other source
  useEffect(() => {
    const fetchedClientId = localStorage.getItem('clientId'); // Example: Replace with actual logic
    if (fetchedClientId) {
      setClientId(fetchedClientId);
    } else {
      console.warn('No clientId found, fetching all clients');
    }
  }, []);

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error) {
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
          <Typography variant="h5">Clients</Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/clients/new')}
          >
            Add Client
          </Button>
        </Box>
        <DataTable
          columns={[
            { field: 'client_name', headerName: 'Client Name' },
            { field: 'email', headerName: 'Email' },
            { field: 'phone', headerName: 'Phone' },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 100,
              renderCell: (params) => (
                <Button
                  onClick={() => navigate(`/clients/${params.row.uid}`)}
                  variant="outlined"
                  size="small"
                >
                  View
                </Button>
              ),
            },
          ]}
          data={clients || []} // Use clients array from useClientData
        />
      </Paper>
    </Box>
  );
};

export default Clients;
