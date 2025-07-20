// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Container, Box, Alert } from '@mui/material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import { useUser } from '../context/UserContext';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Must be a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const { refreshUser } = useUser();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await api.login(values.email, values.password);
      console.log('Login response:', response);
      const { token } = response;
      console.log('Extracted token:', token);
      localStorage.setItem('token', token);
      console.log('Token set in localStorage:', localStorage.getItem('token'));
      await refreshUser(); // Await to ensure profile is fetched
      setError('');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err.response || err.message);
      setError(err.response?.data?.message || 'Failed to connect to server');
      showSnackbar('Login failed', 'error');
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs" className="content-container">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          MyDashboard Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Alert>}
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form style={{ width: '100%' }}>
              <Field
                as={TextField}
                name="email"
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
              />
              <Field
                as={TextField}
                name="password"
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                error={touched.password && !!errors.password}
                helperText={touched.password && errors.password}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={isSubmitting}
              >
                Login
              </Button>
            </Form>
          )}
        </Formik>
        <Button
          component={Link}
          to="/register"
          variant="text"
          color="primary"
          sx={{ mt: 2, alignSelf: 'flex-end' }}
        >
          Don't have an account? Register
        </Button>
      </Box>
    </Container>
  );
};

export default Login;