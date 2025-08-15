// src/hooks/useClientData.js
import { useState, useEffect } from 'react';
import api from '../services/api'; // Corrected import path

const useClientData = (clientId) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClient = async (id) => {
    console.log('Fetching client for UID:', id);
    if (!id || id === 'undefined' || typeof id !== 'string' || id.trim() === '') {
      console.warn('Skipping API call due to invalid client ID:', id);
      setError('Invalid client ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/api/clients/${id}`);
      setClient(response.data);
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
      setError('Invalid client ID');
      return;
    }
    fetchClient(clientId);
  }, [clientId]);

  return { client, loading, error };
};

export default useClientData;