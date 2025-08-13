import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import jwtDecode from 'jwt-decode';

export const useUserRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem('token');
      const defaultRoles = [
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
        { value: 'Employee', label: 'Employee' },
      ];
      if (!token) {
        setError('No authentication token found');
        setRoles(defaultRoles);
        setLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          showSnackbar('Session expired, please log in', 'error');
          navigate('/login', { replace: true });
          setRoles(defaultRoles);
          setLoading(false);
          return;
        }
        const response = await api.get('/roles', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000, // Increased timeout
        });
        const fetchedRoles = Array.isArray(response.data.data)
          ? response.data.data.map((role) => ({ value: role.name, label: role.name }))
          : defaultRoles;
        setRoles(fetchedRoles);
        setLoading(false);
      } catch (err) {
        console.error('Fetch roles error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else if (err.response?.status === 403) {
          showSnackbar('Permission denied: Admin access required', 'error');
        } else {
          showSnackbar('Failed to fetch roles', 'error');
        }
        setError('Failed to fetch roles');
        setRoles(defaultRoles);
        setLoading(false);
      }
    };
    fetchRoles();
  }, [navigate, showSnackbar]);

  return { roles, loading, error };
};