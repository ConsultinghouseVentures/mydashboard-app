// src/components/UserDetail.jsx
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
import { useUserRoles } from '../constants/roles'; // Updated to use hook for dynamic roles

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

const UserDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();
  const { roles: USER_ROLES, loading: rolesLoading, error: rolesError } = useUserRoles(); // Use hook for dynamic roles
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/api/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
        setUserData(response.data || response); // Handle if response is data or wrapped
      } catch (err) {
        console.error('Fetch user error:', err);
        setError(err.response?.data?.message || 'Failed to fetch user details');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to fetch user details', 'error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid, navigate, showSnackbar]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.put(`/api/users/${uid}`, userData, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(response.data || response);
      setEditMode(false);
      showSnackbar('User updated successfully', 'success');
    } catch (err) {
      console.error('Update user error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } else {
        showSnackbar('Failed to update user', 'error');
      }
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading || rolesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || rolesError) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error || rolesError}</Typography>
      </Box>
    );
  }

  if (!userData) return null;

  const isUS = userData.country === 'United States of America (the)';

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Typography variant="h4" component="h1">
            User: {userData.name || ''}
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
            <IconButton onClick={() => navigate('/admin')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>

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
                value={userData.name || ''}
                onChange={handleChange('name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={userData.email || ''}
                onChange={handleChange('email')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userData.role || ''}
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
                value={userData.first_name || ''}
                onChange={handleChange('first_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={userData.last_name || ''}
                onChange={handleChange('last_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={userData.phone || ''}
                onChange={handleChange('phone')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                fullWidth
                value={userData.website || ''}
                onChange={handleChange('website')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Academic Title</InputLabel>
                <Select
                  value={userData.academic_title || ''}
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
                  value={userData.salutation || ''}
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
                  value={userData.gender || ''}
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
                value={userData.street1 || ''}
                onChange={handleChange('street1')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Street 2"
                fullWidth
                value={userData.street2 || ''}
                onChange={handleChange('street2')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ZIP"
                fullWidth
                value={userData.zip || ''}
                onChange={handleChange('zip')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={userData.city || ''}
                onChange={handleChange('city')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {isUS ? (
                <FormControl fullWidth>
                  <InputLabel shrink>State</InputLabel>
                  <Select
                    value={userData.state || ''}
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
                  value={userData.state || ''}
                  onChange={handleChange('state')}
                  disabled={!editMode}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country</InputLabel>
                <Select
                  value={userData.country || ''}
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
                value={userData.employment_start || ''}
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
                value={userData.employment_end || ''}
                onChange={handleChange('employment_end')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Religion"
                fullWidth
                value={userData.religion || ''}
                onChange={handleChange('religion')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Marital Status</InputLabel>
                <Select
                  value={userData.marital_status || ''}
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
                value={userData.education || ''}
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
                value={userData.date_of_birth || ''}
                onChange={handleChange('date_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Place of Birth"
                fullWidth
                value={userData.place_of_birth || ''}
                onChange={handleChange('place_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country of Birth</InputLabel>
                <Select
                  value={userData.country_of_birth || ''}
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
                value={userData.birth_name || ''}
                onChange={handleChange('birth_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Citizenship</InputLabel>
                <Select
                  value={userData.citizenship || ''}
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
                value={userData.place_of_residence || ''}
                onChange={handleChange('place_of_residence')}
                disabled={!editMode}
              />
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
                value={userData.bank_name || ''}
                onChange={handleChange('bank_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Code No."
                fullWidth
                value={userData.bank_code_no || ''}
                onChange={handleChange('bank_code_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Account No."
                fullWidth
                value={userData.bank_account_no || ''}
                onChange={handleChange('bank_account_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="IBAN"
                fullWidth
                value={userData.iban || ''}
                onChange={handleChange('iban')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="SWIFT/BIC"
                fullWidth
                value={userData.swift_bic || ''}
                onChange={handleChange('swift_bic')}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/admin')}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserDetail;