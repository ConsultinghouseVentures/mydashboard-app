// src/components/EmployeeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Paper,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Edit, Save } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../constants/countries';
import { USER_ROLES } from '../constants/roles';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const EmployeeDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();
  const [employee, setEmployee] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        setLoading(true);
        const employeeRes = await api.get(`/api/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
        setEmployee(employeeRes.data);
        const clientsRes = await api.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
        setClients(clientsRes.data);
      } catch (err) {
        console.error('Fetch employee error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to fetch employee details', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    if (uid) {
      fetchEmployee();
    } else {
      setLoading(false);
      showSnackbar('Invalid employee ID', 'error');
    }
  }, [uid, navigate, showSnackbar]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.put(`/api/users/${uid}`, employee, { headers: { Authorization: `Bearer ${token}` } });
      setEmployee(response.data);
      setEditMode(false);
      showSnackbar('Employee updated successfully', 'success');
    } catch (err) {
      console.error('Update employee error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } else {
        showSnackbar('Failed to update employee', 'error');
      }
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setEmployee((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
    setEmployee((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) return null;

  const isUS = employee.country === 'United States of America (the)';

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 950,
          p: 4,
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Typography variant="h4" component="h1">
            Employee: {employee.name || ''}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!editMode ? (
              <Button startIcon={<Edit />} onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
                Edit
              </Button>
            ) : (
              <Button startIcon={<Save />} color="primary" variant="contained" onClick={handleSave} sx={{ mr: 1 }}>
                Save
              </Button>
            )}
            <IconButton onClick={() => navigate('/employees')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          Client: {employee.client ? employee.client.name : 'None associated'}
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered variant={isMobile ? 'scrollable' : 'standard'}>
          <Tab label="Login" />
          <Tab label="Personal" />
          <Tab label="Payroll" />
          <Tab label="Bank" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Login Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Display Name"
                fullWidth
                value={employee.name || ''}
                onChange={handleChange('name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={employee.email || ''}
                onChange={handleChange('email')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={employee.role || ''}
                  label="Role"
                  onChange={handleSelectChange('role')}
                  disabled={!editMode}
                >
                  {USER_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={employee.first_name || ''}
                onChange={handleChange('first_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={employee.last_name || ''}
                onChange={handleChange('last_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={employee.phone || ''}
                onChange={handleChange('phone')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                fullWidth
                value={employee.website || ''}
                onChange={handleChange('website')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Academic Title</InputLabel>
                <Select
                  value={employee.academic_title || ''}
                  label="Academic Title"
                  onChange={handleSelectChange('academic_title')}
                  disabled={!editMode}
                  notched
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Dr.">Dr.</MenuItem>
                  <MenuItem value="Prof.">Prof.</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Salutation</InputLabel>
                <Select
                  value={employee.salutation || ''}
                  label="Salutation"
                  onChange={handleSelectChange('salutation')}
                  disabled={!editMode}
                  notched
                >
                  <MenuItem value="Mr.">Mr.</MenuItem>
                  <MenuItem value="Ms.">Ms.</MenuItem>
                  <MenuItem value="Mrs.">Mrs.</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Gender</InputLabel>
                <Select
                  value={employee.gender || ''}
                  label="Gender"
                  onChange={handleSelectChange('gender')}
                  disabled={!editMode}
                  notched
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Non-binary">Non-binary</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Street 1"
                fullWidth
                value={employee.street1 || ''}
                onChange={handleChange('street1')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Street 2"
                fullWidth
                value={employee.street2 || ''}
                onChange={handleChange('street2')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ZIP"
                fullWidth
                value={employee.zip || ''}
                onChange={handleChange('zip')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={employee.city || ''}
                onChange={handleChange('city')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {isUS ? (
                <FormControl fullWidth>
                  <InputLabel shrink>State</InputLabel>
                  <Select
                    value={employee.state || ''}
                    label="State"
                    onChange={handleSelectChange('state')}
                    disabled={!editMode}
                    notched
                  >
                    {usStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="State"
                  fullWidth
                  value={employee.state || ''}
                  onChange={handleChange('state')}
                  disabled={!editMode}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country</InputLabel>
                <Select
                  value={employee.country || ''}
                  label="Country"
                  onChange={handleSelectChange('country')}
                  disabled={!editMode}
                  notched
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Payroll Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Beginning of Employment"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={employee.employment_start || ''}
                onChange={handleChange('employment_start')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End of Employment"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={employee.employment_end || ''}
                onChange={handleChange('employment_end')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Religion"
                fullWidth
                value={employee.religion || ''}
                onChange={handleChange('religion')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Marital Status</InputLabel>
                <Select
                  value={employee.marital_status || ''}
                  label="Marital Status"
                  onChange={handleSelectChange('marital_status')}
                  disabled={!editMode}
                  notched
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Divorced">Divorced</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Education"
                fullWidth
                value={employee.education || ''}
                onChange={handleChange('education')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={employee.date_of_birth || ''}
                onChange={handleChange('date_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Place of Birth"
                fullWidth
                value={employee.place_of_birth || ''}
                onChange={handleChange('place_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country of Birth</InputLabel>
                <Select
                  value={employee.country_of_birth || ''}
                  label="Country of Birth"
                  onChange={handleSelectChange('country_of_birth')}
                  disabled={!editMode}
                  notched
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Birth Name"
                fullWidth
                value={employee.birth_name || ''}
                onChange={handleChange('birth_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Citizenship</InputLabel>
                <Select
                  value={employee.citizenship || ''}
                  label="Citizenship"
                  onChange={handleSelectChange('citizenship')}
                  disabled={!editMode}
                  notched
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Place of Residence"
                fullWidth
                value={employee.place_of_residence || ''}
                onChange={handleChange('place_of_residence')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Employer</InputLabel>
                <Select
                  value={employee.client_id || ''}
                  label="Employer"
                  onChange={handleSelectChange('client_id')}
                  disabled={!editMode}
                  notched
                >
                  <MenuItem value="">None</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Bank Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Name"
                fullWidth
                value={employee.bank_name || ''}
                onChange={handleChange('bank_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Code No."
                fullWidth
                value={employee.bank_code_no || ''}
                onChange={handleChange('bank_code_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Account No."
                fullWidth
                value={employee.bank_account_no || ''}
                onChange={handleChange('bank_account_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="IBAN"
                fullWidth
                value={employee.iban || ''}
                onChange={handleChange('iban')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="SWIFT/BIC"
                fullWidth
                value={employee.swift_bic || ''}
                onChange={handleChange('swift_bic')}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/employees')}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmployeeDetail;