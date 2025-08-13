// src/components/UserDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Typography,
  Box,
  Button,
  TextField,
  Avatar,
  Paper,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, Edit, Save } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../constants/countries';
import { useUserRoles } from '../constants/roles';

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

const PasswordSchema = Yup.object().shape({
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const usernameSchema = Yup.string().email('Invalid email address').required('User name (email) is required');

const UserDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { roles } = useUserRoles();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get(`/users/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('User detail response:', response);
        const data = response.data.data || response.data;
        if (!data || Object.keys(data).length === 0 || !data.uid) {
          throw new Error('Invalid user data');
        }
        setUserData({
          uid: data.uid || '',
          username: data.username || data.email || '',
          name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || '',
          role: data.role || 'None',
          status: data.status || 'Active',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          academic_title: data.academic_title || '',
          salutation: data.salutation || '',
          gender: data.gender || '',
          phone: data.phone || '',
          website: data.website || '',
          employment_start: data.employment_start || '',
          employment_end: data.employment_end || '',
          religion: data.religion || '',
          marital_status: data.marital_status || '',
          education: data.education || '',
          date_of_birth: data.date_of_birth || '',
          place_of_birth: data.place_of_birth || '',
          country_of_birth: data.country_of_birth || '',
          birth_name: data.birth_name || '',
          citizenship: data.citizenship || '',
          place_of_residence: data.place_of_residence || '',
          street1: data.street1 || '',
          street2: data.street2 || '',
          zip: data.zip || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          bank_name: data.bank_name || '',
          bank_code_no: data.bank_code_no || '',
          bank_account_no: data.bank_account_no || '',
          iban: data.iban || '',
          swift_bic: data.swift_bic || '',
        });
        setError(null);
      } catch (err) {
        console.error('Fetch user error:', err);
        setError(err.response?.data?.message || 'Failed to fetch user details');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          showSnackbar('User not found', 'error');
        } else {
          showSnackbar('Failed to load user details', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [uid, navigate, showSnackbar]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      navigate('/login', { replace: true });
      return;
    }
    try {
      await usernameSchema.validate(userData.username);
    } catch (validationErr) {
      showSnackbar(validationErr.message, 'error');
      return;
    }
    try {
      const response = await api.put(`/users/${uid}`, { ...userData, email: userData.username }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedData = response.data.data || response.data;
      setUserData(updatedData);
      setEditMode(false);
      showSnackbar('User updated successfully', 'success');
    } catch (err) {
      console.error('Update user error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update user', 'error');
    }
  };

  const handlePasswordSubmit = async (values, { setSubmitting }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      navigate('/login', { replace: true });
      setSubmitting(false);
      return;
    }
    try {
      await api.put(`/users/${uid}/password`, { password: values.password }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Password changed successfully', 'success');
      setSubmitting(false);
    } catch (err) {
      console.error('Password change error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to change password', 'error');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  }

  if (error || !userData) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">{error || 'User not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/admin/user-management')} sx={{ mt: 2 }}>
          Back to User Management
        </Button>
      </Box>
    );
  }

  const isUS = userData.country === 'United States of America (the)';

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 950,
          p: 4,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Typography variant="h4" component="h1">
            User Profile
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
            <IconButton onClick={() => navigate('/admin/user-management')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Avatar
            sx={{ width: 120, height: 120, fontSize: 48 }}
            alt={userData.name || 'User'}
            src="/placeholder-avatar.jpg"
          >
            {userData.name?.charAt(0) || ''}
          </Avatar>
        </Box>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
          <Tab label="Login" />
          <Tab label="Personal" />
          <Tab label="Payroll" />
          <Tab label="Bank" />
          <Tab label="Security" />
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
                label="User name (email)"
                fullWidth
                value={userData.username || ''}
                onChange={handleChange('username')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userData.role || ''}
                  onChange={handleSelectChange('role')}
                  disabled={!editMode}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={userData.status || 'Active'}
                  onChange={handleSelectChange('status')}
                  disabled={!editMode}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
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
                label="Employment Start"
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
                label="Employment End"
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

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="password"
                      label="New Password"
                      type="password"
                      fullWidth
                      error={touched.password && !!errors.password}
                      helperText={touched.password && errors.password}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      fullWidth
                      error={touched.confirmPassword && !!errors.confirmPassword}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={isSubmitting}
                >
                  Change Password
                </Button>
              </Form>
            )}
          </Formik>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default UserDetail;