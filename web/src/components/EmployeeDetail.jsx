// web/src/components/EmployeeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Box, Button, IconButton, Tabs, Tab, Paper, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ArrowBack, Edit, Save } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../data/countries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployeeDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    status: 'Active',
    role: 'Employee',
    client_id: '',
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get(`/employees/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        const data = response.data.data || response.data;
        if (!data || Object.keys(data).length === 0 || !data.uid) {
          throw new Error('Invalid employee data');
        }
        setEmployee(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          status: data.status || 'Active',
          role: data.role || 'Employee',
          client_id: data.client_id || '',
        });
        setError(null);
      } catch (err) {
        console.error('Fetch employee error:', err);
        setError(err.response?.data?.message || 'Failed to fetch employee details');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to load employee details', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployee();
  }, [uid, navigate, showSnackbar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      navigate('/login', { replace: true });
      return;
    }
    try {
      const response = await api.put(`/employees/${uid}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      setEmployee(response.data.data || response.data);
      setEditMode(false);
      showSnackbar('Employee updated successfully', 'success');
    } catch (err) {
      console.error('Update employee error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update employee', 'error');
    }
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error || !employee) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error || 'Employee not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/employees')} sx={{ mt: 2 }}>
          Back to Employees
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
          <Typography variant="h5">Employee: {`${employee.first_name} ${employee.last_name}`}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!editMode ? (
              <Button startIcon={<Edit />} variant="outlined" onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
                Edit
              </Button>
            ) : (
              <Button startIcon={<Save />} variant="contained" onClick={handleSave} sx={{ mr: 1 }}>
                Save
              </Button>
            )}
            <IconButton onClick={() => navigate('/employees')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
          <Tab label="General" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="first_name"
                value={editMode ? formData.first_name : employee.first_name || ''}
                onChange={handleInputChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="last_name"
                value={editMode ? formData.last_name : employee.last_name || ''}
                onChange={handleInputChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={editMode ? formData.email : employee.email || ''}
                onChange={handleInputChange}
                fullWidth
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editMode ? formData.status : employee.status || ''}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!editMode}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={editMode ? formData.role : employee.role || ''}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default EmployeeDetail;