// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import api from '../services/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.warn('Token expired in UserContext, clearing user');
          localStorage.removeItem('token');
          setUser(null);
          return;
        }
        let userData = decoded;
        if (!decoded.username) {
          const response = await api.getProfile({ headers: { Authorization: `Bearer ${token}` } });
          userData = {
            ...decoded,
            username: response.username,
            name: response.name || '',
            role: response.role || 'user',
            ...response, // Merge additional fields
          };
        }
        setUser(userData);
      } catch (err) {
        console.error('Invalid token or profile fetch error in UserContext:', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser(); // Initial load
    window.addEventListener('storage', refreshUser); // Listen for cross-tab changes
    return () => window.removeEventListener('storage', refreshUser);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);