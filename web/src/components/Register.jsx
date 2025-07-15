// src/components/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Container, Box, Alert, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext.jsx';

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email('Must be a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  name: Yup.string().required('Name is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [error, setError] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await api.register(values.email, values.password, values.name);
      console.log('Register response:', response);
      localStorage.setItem('token', response.token);
      console.log('Token set:', response.token);
      setError('');
      showSnackbar('Registration successful');
      navigate('/dashboard');
    } catch (err) {
      console.error('Register error:', err.response || err.message);
      setError(err.response?.data?.message || 'Failed to register');
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <IconButton
          sx={{ position: 'absolute', top: 0, right: 0 }}
          onClick={() => navigate('/login')}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom>
          Register
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Formik
          initialValues={{ email: '', password: '', name: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                name="name"
                label="Name"
                fullWidth
                margin="normal"
                error={touched.name && !!errors.name}
                helperText={touched.name && errors.name}
              />
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
                Register
              </Button>
            </Form>
          )}
        </Formik>
        <Button
          component={Link}
          to="/login"
          variant="text"
          color="primary"
          sx={{ mt: 2, alignSelf: 'flex-end' }}
        >
          Already have an account? Login
        </Button>
      </Box>
    </Container>
  );
};

export default Register;