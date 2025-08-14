// web/src/hooks/useClientData.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';

export const useClientData = (uid) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [client, setClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showSnackbar('No authentication token found', 'error');
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        console.log('Fetching client for UID:', uid);
        const response = await api.get(`/clients/${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        const data = response.data.data || response.data;
        if (!data || Object.keys(data).length === 0 || !data.uid) {
          throw new Error('Invalid client data');
        }
        setClient(data);
        const employeesRes = await api.get(`/employees?client_id=${uid}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        console.log('Employees response:', employeesRes.data);
        console.log('Employee data structure:', employeesRes.data.data);
        setEmployees(employeesRes.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Fetch client error:', err);
        setError(err.response?.data?.message || 'Failed to fetch client details');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          showSnackbar('Unauthorized: Please log in again', 'error');
          navigate('/login', { replace: true });
        } else {
          showSnackbar('Failed to load client details', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchClient();
  }, [uid, navigate, showSnackbar]);

  return { client, employees, isLoading, error, setClient, setEmployees };
};