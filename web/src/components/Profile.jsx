// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useTheme,
  useMediaQuery,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Edit, Save } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';
import { countries } from '../constants/countries';
import jwtDecode from 'jwt-decode';

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

const Profile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar } = useSnackbar();
  const { user, refreshUser } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for sidebar collapse state
  useEffect(() => {
    const handleSidebarToggle = () => {
      setIsSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for profile fetch');
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token for profile:', decoded);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          setIsLoading(false);
          return;
        }
        if (!decoded.uid) {
          console.error('No uid in decoded token:', decoded);
          showSnackbar('Invalid user data in token', 'error');
          navigate('/login', { replace: true });
          setIsLoading(false);
          return;
        }
        const response = await api.getProfile({
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Profile response:', response);
        const data = response.data.data || response.data;
        console.log('Profile data:', data);
        if (!data || Object.keys(data).length === 0 || !data.uid) {
          console.error('Invalid or empty user data returned from API:', data);
          showSnackbar('No user data found', 'error');
          setIsLoading(false);
          return;
        }
        setProfileData({
          uid: data.uid || '',
          username: data.username || data.email || '',
          name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || '',
          role: data.role || 'None',
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
          created_at: data.created_at ? new Date(data.created_at * 1000) : null,
          updated_at: data.updated_at ? new Date(data.updated_at) : null,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch profile error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          refreshUser();
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 404) {
          showSnackbar('User profile not found', 'error');
        } else {
          showSnackbar('Failed to load profile', 'error');
        }
        setIsLoading(false);
      }
    };
    if (user?.uid) {
      fetchUser();
    } else {
      console.log('No user UID available:', user);
      showSnackbar('No user data available', 'error');
      setIsLoading(false);
    }
  }, [navigate, refreshUser, showSnackbar, user]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('No authentication token found', 'error');
      navigate('/login', { replace: true });
      return;
    }
    try {
      await usernameSchema.validate(profileData.username);
    } catch (validationErr) {
      showSnackbar(validationErr.message, 'error');
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
      const dataToSend = { ...profileData, email: profileData.username, username: profileData.username.toLowerCase() };
      console.log('Sending profile data for update:', dataToSend);
      const response = await api.updateProfile(dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Update profile response:', response);
      const newData = response.data.data || response.data;
      if (!newData || Object.keys(newData).length === 0 || !newData.uid) {
        console.error('Invalid or empty user data returned from update:', newData);
        showSnackbar('Failed to update profile: No user data', 'error');
        return;
      }
      setProfileData({
        uid: newData.uid || '',
        username: newData.username || newData.email || '',
        name: newData.name || `${newData.first_name || ''} ${newData.last_name || ''}`.trim() || '',
        role: newData.role || 'None',
        first_name: newData.first_name || '',
        last_name: newData.last_name || '',
        academic_title: newData.academic_title || '',
        salutation: newData.salutation || '',
        gender: newData.gender || '',
        phone: newData.phone || '',
        website: newData.website || '',
        employment_start: newData.employment_start || '',
        employment_end: newData.employment_end || '',
        religion: newData.religion || '',
        marital_status: newData.marital_status || '',
        education: newData.education || '',
        date_of_birth: newData.date_of_birth || '',
        place_of_birth: newData.place_of_birth || '',
        country_of_birth: newData.country_of_birth || '',
        birth_name: newData.birth_name || '',
        citizenship: newData.citizenship || '',
        place_of_residence: newData.place_of_residence || '',
        street1: newData.street1 || '',
        street2: newData.street2 || '',
        zip: newData.zip || '',
        city: newData.city || '',
        state: newData.state || '',
        country: newData.country || '',
        bank_name: newData.bank_name || '',
        bank_code_no: newData.bank_code_no || '',
        bank_account_no: newData.bank_account_no || '',
        iban: newData.iban || '',
        swift_bic: newData.swift_bic || '',
        created_at: newData.created_at ? new Date(newData.created_at * 1000) : null,
        updated_at: newData.updated_at ? new Date(newData.updated_at) : null,
      });
      showSnackbar('Profile updated successfully', 'success');
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      showSnackbar(err.response?.data?.message || 'Profile not updated', 'error');
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
    setProfileData((prev) => ({ ...prev, [field]: value }));
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
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        showSnackbar('Session expired, please log in', 'error');
        navigate('/login', { replace: true });
        setSubmitting(false);
        return;
      }
      await api.changePassword({ password: values.password }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showSnackbar('Password changed successfully', 'success');
      setSubmitting(false);
    } catch (err) {
      console.error('Password change error:', err.response?.data || err.message);
      showSnackbar(err.response?.data?.message || 'Password not updated', 'error');
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  }

  if (!user || !profileData) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">Failed to load user data. Please try logging in again.</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Go to Login
        </Button>
      </Box>
    );
  }

  const isUS = profileData.country === 'United States of America (the)';

  return (
    <Box
      sx={{
        ml: { xs: 0, sm: isSidebarCollapsed ? '60px' : '240px' },
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
            Profile
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
            <IconButton onClick={() => navigate('/dashboard')}>
              <ArrowBack />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Avatar
            sx={{ width: 120, height: 120, fontSize: 48 }}
            alt={profileData.name || 'User'}
            src="/placeholder-avatar.jpg"
          >
            {profileData.name?.charAt(0) || ''}
          </Avatar>
        </Box>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered variant={isMobile ? 'scrollable' : 'standard'}>
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
                value={profileData.name || ''}
                onChange={handleChange('name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="User name (email)"
                fullWidth
                value={profileData.username || ''}
                onChange={handleChange('username')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Role"
                fullWidth
                value={profileData.role || 'None'}
                disabled
              />
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
                value={profileData.first_name || ''}
                onChange={handleChange('first_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={profileData.last_name || ''}
                onChange={handleChange('last_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={profileData.phone || ''}
                onChange={handleChange('phone')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                fullWidth
                value={profileData.website || ''}
                onChange={handleChange('website')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Academic Title</InputLabel>
                <Select
                  value={profileData.academic_title || ''}
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
                  value={profileData.salutation || ''}
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
                  value={profileData.gender || ''}
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
                value={profileData.street1 || ''}
                onChange={handleChange('street1')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Street 2"
                fullWidth
                value={profileData.street2 || ''}
                onChange={handleChange('street2')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ZIP"
                fullWidth
                value={profileData.zip || ''}
                onChange={handleChange('zip')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={profileData.city || ''}
                onChange={handleChange('city')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {isUS ? (
                <FormControl fullWidth>
                  <InputLabel shrink>State</InputLabel>
                  <Select
                    value={profileData.state || ''}
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
                  value={profileData.state || ''}
                  onChange={handleChange('state')}
                  disabled={!editMode}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country</InputLabel>
                <Select
                  value={profileData.country || ''}
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
                value={profileData.employment_start || ''}
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
                value={profileData.employment_end || ''}
                onChange={handleChange('employment_end')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Religion"
                fullWidth
                value={profileData.religion || ''}
                onChange={handleChange('religion')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Marital Status</InputLabel>
                <Select
                  value={profileData.marital_status || ''}
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
                value={profileData.education || ''}
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
                value={profileData.date_of_birth || ''}
                onChange={handleChange('date_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Place of Birth"
                fullWidth
                value={profileData.place_of_birth || ''}
                onChange={handleChange('place_of_birth')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Country of Birth</InputLabel>
                <Select
                  value={profileData.country_of_birth || ''}
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
                value={profileData.birth_name || ''}
                onChange={handleChange('birth_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Citizenship</InputLabel>
                <Select
                  value={profileData.citizenship || ''}
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
                value={profileData.place_of_residence || ''}
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
                value={profileData.bank_name || ''}
                onChange={handleChange('bank_name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Code No."
                fullWidth
                value={profileData.bank_code_no || ''}
                onChange={handleChange('bank_code_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Account No."
                fullWidth
                value={profileData.bank_account_no || ''}
                onChange={handleChange('bank_account_no')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="IBAN"
                fullWidth
                value={profileData.iban || ''}
                onChange={handleChange('iban')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="SWIFT/BIC"
                fullWidth
                value={profileData.swift_bic || ''}
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

export default Profile;