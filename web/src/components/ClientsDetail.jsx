// web/src/components/ClientsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Box, Button, IconButton, Tabs, Tab, Paper, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ArrowBack, Edit, Save, Add } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useClientData } from '../hooks/useClientData';
import DataTable from './DataTable';
import AddEmployeeForm from './AddEmployeeForm';
import formFields from '../config/formConfig';
import { countries } from '../data/countries';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientsDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { client, employees, isLoading, error, setClient, setEmployees } = useClientData(uid);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [addEmployeeFormData, setAddEmployeeFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    status: 'Active',
    role: 'Employee',
    client_id: uid,
  });
  const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);

  useEffect(() => {
    if (client) {
      const initialFormData = formFields.general.reduce((acc, field) => ({
        ...acc,
        [field.name]: client[field.name] || '',
      }), {});
      setFormData(initialFormData);
    }
  }, [client]);

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
      const response = await api.put(`/clients/${uid}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      setClient(response.data.data || response.data);
      setEditMode(false);
      showSnackbar('Client updated successfully', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update client', 'error');
    }
  };

  const handleAddEmployeeChange = (event) => {
    const { name, value } = event.target;
    setAddEmployeeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEmployeeSubmit = async () => {
    if (!addEmployeeFormData.first_name || !addEmployeeFormData.last_name || !addEmployeeFormData.email || !addEmployeeFormData.password) {
      showSnackbar('Missing required fields', 'error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(addEmployeeFormData.email)) {
      showSnackbar('Invalid email format', 'error');
      return;
    }
    setAddEmployeeLoading(true);
    const token = localStorage.getItem('token');
    try {
      const payload = { ...addEmployeeFormData, username: addEmployeeFormData.email };
      await api.post('/employees', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      showSnackbar('Employee added successfully', 'success');
      const employeesRes = await api.get(`/employees?client_id=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      console.log('Employees response after adding:', employeesRes.data);
      setEmployees(employeesRes.data.data || []);
      setOpenAddEmployee(false);
      setAddEmployeeFormData({ first_name: '', last_name: '', email: '', password: '', status: 'Active', role: 'Employee', client_id: uid });
    } catch (err) {
      console.error('Add employee error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to add employee', 'error');
    } finally {
      setAddEmployeeLoading(false);
    }
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error || !client) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error || 'Client not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/clients')} sx={{ mt: 2 }}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
          <Typography variant="h5">Client: {client.client_name || 'Details'}</Typography>
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
            <IconButton onClick={() => navigate('/clients')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
          <Tab label="General" />
          <Tab label="Employees" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {formFields.general.map((field) => (
              <Grid item {...field.grid} key={field.name}>
                {field.type === 'select' ? (
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      name={field.name}
                      value={editMode ? formData[field.name] || '' : client[field.name] || ''}
                      onChange={handleInputChange}
                    >
                      {field.options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label={field.label}
                    name={field.name}
                    type={field.type}
                    value={editMode ? formData[field.name] || '' : client[field.name] || ''}
                    onChange={handleInputChange}
                    fullWidth
                    disabled={!editMode}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Employees ({employees.length})</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setOpenAddEmployee(true)}>
              Add Employee
            </Button>
          </Box>
          <DataTable
            columns={[
              { field: 'name', headerName: 'Name' },
              { field: 'email', headerName: 'Email' },
              { field: 'user_roles', headerName: 'User Roles' },
            ]}
            data={employees.map((emp) => ({
              ...emp,
              user_roles: emp.user_roles ? emp.user_roles.replace(/[{}]/g, '').split(',').join(', ') : '',
            }))}
          />
        </TabPanel>
      </Paper>
      <AddEmployeeForm
        open={openAddEmployee}
        onClose={() => setOpenAddEmployee(false)}
        formData={addEmployeeFormData}
        onChange={handleAddEmployeeChange}
        onSubmit={handleAddEmployeeSubmit}
        loading={addEmployeeLoading}
        clientName={client.client_name || 'Unknown Client'}
      />
    </Box>
  );
};

export default ClientsDetail;