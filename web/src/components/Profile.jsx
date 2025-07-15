// src/components/Profile.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Typography,
  Container,
  Box,
  Button,
  TextField,
  IconButton,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import jwtDecode from 'jwt-decode';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { countries } from '../constants/countries';

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

const Profile = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state (assuming a global state or prop could be used; here we simulate)
  useEffect(() => {
    // Placeholder for sidebar state detection; ideally, use context or props
    const handleSidebarToggle = () => {
      // This is a simulation; replace with actual sidebar state logic if available
      setIsSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      console.log('Token in Profile:', token);
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded JWT:', decoded);
        setUser({
          username: decoded.username,
          email: decoded.username,
          name: decoded.name || '',
          academic_title: '',
          salutation: '',
          gender: '',
          first_name: '',
          last_name: '',
          street1: '',
          street2: '',
          zip: '',
          city: '',
          state: '',
          country: '',
          phone: '',
          website: '',
          employment_start: '',
          employment_end: '',
          religion: '',
          marital_status: '',
          education: '',
          date_of_birth: '',
          place_of_birth: '',
          country_of_birth: '',
          birth_name: '',
          citizenship: '',
          place_of_residence: '',
          bank_name: '',
          bank_code_no: '',
          bank_account_no: '',
          iban: '',
          swift_bic: '',
        });
        const response = await api.getProfile({ headers: { Authorization: `Bearer ${token}` } });
        setUser((prev) => ({ ...prev, ...response }));
      } catch (err) {
        console.error('Fetch profile error:', err);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    };
    fetchUser();
  }, [navigate]);

  const saveField = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.updateProfile({ [field]: value }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem('token', response.token);
      showSnackbar(`${field} updated successfully`, 'success');
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      showSnackbar(`${field} not updated`, 'error');
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field) => () => {
    saveField(field, user[field]);
  };

  const handleSelectChange = (field) => (event) => {
    const value = event.target.value;
    setUser((prev) => ({ ...prev, [field]: value }));
    saveField(field, value);
  };

  const handlePasswordSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.changePassword({ password: values.password }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem('token', response.token);
      showSnackbar('Password changed successfully', 'success');
    } catch (err) {
      console.error('Password change error:', err.response || err.message);
      showSnackbar('Password not updated', 'error');
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const isUS = user.country === 'United States of America (the)';

  return (
    <Container
      maxWidth={false}
      className="content-container"
      sx={{
        ml: { xs: 0, sm: isSidebarCollapsed ? 'min(15vw, 60px)' : 'min(25vw, 240px)' },
        mr: { xs: 0, sm: isSidebarCollapsed ? 'min(15vw, 60px)' : 'min(25vw, 240px)' },
        p: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <IconButton
          sx={{ position: 'absolute', top: 80, right: 16 }}
          onClick={() => navigate('/dashboard')}
        >
          <ArrowBack />
        </IconButton>

        <Typography variant="h4" component="h1" gutterBottom align="center">
          Profile
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
          <Tab label="Login Profile" />
          <Tab label="About Me" />
          <Tab label="Payroll" />
          <Tab label="Bank" />
          <Tab label="Password" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Card className="glass-effect">
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Login Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Display Name"
                    fullWidth
                    margin="normal"
                    value={user.name}
                    onChange={handleChange('name')}
                    onBlur={handleBlur('name')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email (Username)"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={user.email}
                    onChange={handleChange('email')}
                    onBlur={handleBlur('email')}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card className="glass-effect">
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                About Me
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    margin="normal"
                    value={user.first_name}
                    onChange={handleChange('first_name')}
                    onBlur={handleBlur('first_name')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    margin="normal"
                    value={user.last_name}
                    onChange={handleChange('last_name')}
                    onBlur={handleBlur('last_name')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={user.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone"
                    fullWidth
                    margin="normal"
                    value={user.phone}
                    onChange={handleChange('phone')}
                    onBlur={handleBlur('phone')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Website"
                    fullWidth
                    margin="normal"
                    value={user.website}
                    onChange={handleChange('website')}
                    onBlur={handleBlur('website')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Academic Title</InputLabel>
                    <Select
                      value={user.academic_title || ''}
                      label="Academic Title"
                      onChange={handleSelectChange('academic_title')}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="Dr.">Dr.</MenuItem>
                      <MenuItem value="Prof.">Prof.</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Salutation</InputLabel>
                    <Select
                      value={user.salutation || ''}
                      label="Salutation"
                      onChange={handleSelectChange('salutation')}
                    >
                      <MenuItem value="Mr.">Mr.</MenuItem>
                      <MenuItem value="Ms.">Ms.</MenuItem>
                      <MenuItem value="Mrs.">Mrs.</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={user.gender || ''}
                      label="Gender"
                      onChange={handleSelectChange('gender')}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Non-binary">Non-binary</MenuItem>
                      <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom align="center">
                    Address
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Street 1"
                    fullWidth
                    margin="normal"
                    value={user.street1}
                    onChange={handleChange('street1')}
                    onBlur={handleBlur('street1')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Street 2"
                    fullWidth
                    margin="normal"
                    value={user.street2}
                    onChange={handleChange('street2')}
                    onBlur={handleBlur('street2')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ZIP"
                    fullWidth
                    margin="normal"
                    value={user.zip}
                    onChange={handleChange('zip')}
                    onBlur={handleBlur('zip')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="City"
                    fullWidth
                    margin="normal"
                    value={user.city}
                    onChange={handleChange('city')}
                    onBlur={handleBlur('city')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {isUS ? (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>State</InputLabel>
                      <Select
                        value={user.state || ''}
                        label="State"
                        onChange={handleSelectChange('state')}
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
                      margin="normal"
                      value={user.state}
                      onChange={handleChange('state')}
                      onBlur={handleBlur('state')}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={user.country || ''}
                      label="Country"
                      onChange={handleSelectChange('country')}
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
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card className="glass-effect">
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Payroll Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Beginning of Employment"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={user.employment_start}
                    onChange={handleChange('employment_start')}
                    onBlur={handleBlur('employment_start')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End of Employment"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={user.employment_end}
                    onChange={handleChange('employment_end')}
                    onBlur={handleBlur('employment_end')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Religion"
                    fullWidth
                    margin="normal"
                    value={user.religion}
                    onChange={handleChange('religion')}
                    onBlur={handleBlur('religion')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Marital Status</InputLabel>
                    <Select
                      value={user.marital_status || ''}
                      label="Marital Status"
                      onChange={handleSelectChange('marital_status')}
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
                    margin="normal"
                    value={user.education}
                    onChange={handleChange('education')}
                    onBlur={handleBlur('education')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={user.date_of_birth}
                    onChange={handleChange('date_of_birth')}
                    onBlur={handleBlur('date_of_birth')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Place of Birth"
                    fullWidth
                    margin="normal"
                    value={user.place_of_birth}
                    onChange={handleChange('place_of_birth')}
                    onBlur={handleBlur('place_of_birth')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Country of Birth</InputLabel>
                    <Select
                      value={user.country_of_birth || ''}
                      label="Country of Birth"
                      onChange={handleSelectChange('country_of_birth')}
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
                    margin="normal"
                    value={user.birth_name}
                    onChange={handleChange('birth_name')}
                    onBlur={handleBlur('birth_name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Citizenship</InputLabel>
                    <Select
                      value={user.citizenship || ''}
                      label="Citizenship"
                      onChange={handleSelectChange('citizenship')}
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
                    margin="normal"
                    value={user.place_of_residence}
                    onChange={handleChange('place_of_residence')}
                    onBlur={handleBlur('place_of_residence')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card className="glass-effect">
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Personal Bank Account
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bank Name"
                    fullWidth
                    margin="normal"
                    value={user.bank_name}
                    onChange={handleChange('bank_name')}
                    onBlur={handleBlur('bank_name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bank Code No."
                    fullWidth
                    margin="normal"
                    value={user.bank_code_no}
                    onChange={handleChange('bank_code_no')}
                    onBlur={handleBlur('bank_code_no')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Bank Account No."
                    fullWidth
                    margin="normal"
                    value={user.bank_account_no}
                    onChange={handleChange('bank_account_no')}
                    onBlur={handleBlur('bank_account_no')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="IBAN"
                    fullWidth
                    margin="normal"
                    value={user.iban}
                    onChange={handleChange('iban')}
                    onBlur={handleBlur('iban')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="SWIFT/BIC"
                    fullWidth
                    margin="normal"
                    value={user.swift_bic}
                    onChange={handleChange('swift_bic')}
                    onBlur={handleBlur('swift_bic')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Card className="glass-effect">
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Change Password
              </Typography>
              <Formik
                initialValues={{ password: '', confirmPassword: '' }}
                validationSchema={PasswordSchema}
                onSubmit={handlePasswordSubmit}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          name="password"
                          label="New Password"
                          type="password"
                          fullWidth
                          margin="normal"
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
                          margin="normal"
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
                      sx={{ mt: 2 }}
                      disabled={isSubmitting}
                    >
                      Change Password
                    </Button>
                  </Form>
                )}
              </Formik>
            </CardContent>
          </Card>
        </TabPanel>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
          <Button
            component={Link}
            to="/dashboard"
            variant="text"
            color="primary"
          >
            Back
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Profile;