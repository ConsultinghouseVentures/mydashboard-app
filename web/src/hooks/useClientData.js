// src/hooks/useClientData.js
import { useState, useEffect } from 'react';
import api from '../services/api';

const useClientData = (clientId) => {
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]); // Initialize as empty array
  const [employees, setEmployees] = useState([]); // Initialize employees for compatibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClient = async (id) => {
    console.log('Fetching client for UID:', id);
    if (!id || id === 'undefined' || typeof id !== 'string' || id.trim() === '') {
      console.warn('Fetching all clients due to invalid client ID:', id);
      setLoading(true);
      try {
        const response = await api.get('/clients', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          timeout: 30000,
        });
        setClients(response.data.data || []); // Ensure array
        setError(null);
      } catch (err) {
        setError('Failed to fetch clients');
        console.error('Fetch clients error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/clients/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000,
      });
      setClient(response.data.data || response.data);
      // Fetch employees for the client
      const employeesRes = await api.get(`/employees?client_id=${id}&role=Employee`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000,
      });
      setEmployees(employeesRes.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch client data');
      console.error('Fetch client error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId || clientId === 'undefined' || typeof clientId !== 'string' || clientId.trim() === '') {
      console.warn('useEffect: Invalid clientId, skipping fetch:', clientId);
      fetchClient(null); // Trigger fetch all clients
      return;
    }
    fetchClient(clientId);
  }, [clientId]);

  return { client, clients, employees, loading, error, setClient, setEmployees };
};

export default useClientData;