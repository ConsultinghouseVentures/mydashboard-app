// src/constants/roles.js
import { useState, useEffect } from 'react';
import api from '../services/api'; // Assuming api is imported from services/api.js

export const useUserRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setRoles([
          { value: 'Admin', label: 'Admin' },
          { value: 'Manager', label: 'Manager' },
          { value: 'Employee', label: 'Employee' },
          { value: 'User', label: 'User' },
        ]); // Default roles if no token
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/api/permissions/roles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedRoles = Array.isArray(response.data)
          ? response.data.map((role) => ({ value: role, label: role }))
          : [];
        setRoles(fetchedRoles);
        setLoading(false);
      } catch (err) {
        console.error('Fetch roles error:', err);
        setError('Failed to fetch roles');
        setRoles([
          { value: 'Admin', label: 'Admin' },
          { value: 'Manager', label: 'Manager' },
          { value: 'Employee', label: 'Employee' },
          { value: 'User', label: 'User' },
        ]); // Default roles on fetch error (e.g., 403)
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  return { roles, loading, error };
};