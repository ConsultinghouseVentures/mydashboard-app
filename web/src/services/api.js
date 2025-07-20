// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Interceptor to throw errors on non-2xx responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default {
  login: async (email, password) => {
    const response = await api.post('/api/login', { username: email, password });
    return response.data;
  },
  register: async (email, password, first_name, last_name) => {
    const response = await api.post('/api/register', { username: email, password, first_name, last_name });
    return response.data;
  },
  updateProfile: async (data, config) => {
    const response = await api.put('/api/profile', data, config);
    return response.data;
  },
  changePassword: async (data, config) => {
    const response = await api.put('/api/change-password', data, config);
    return response.data;
  },
  getProfile: async (config) => {
    const response = await api.get('/api/profile', config);
    return response.data;
  },
  get: async (url, config) => {
    const response = await api.get(url, config);
    return response.data;
  },
  put: async (url, data, config) => {
    const response = await api.put(url, data, config);
    return response.data;
  },
  delete: async (url, config) => {
    const response = await api.delete(url, config);
    return response.data;
  },
  post: async (url, data, config) => {
    const response = await api.post(url, data, config);
    return response.data;
  },
  getEmployees: async (config) => {
    const response = await api.get('/api/employees', config);
    return response.data;
  },
  getEmployee: async (uid, config) => {
    const response = await api.get(`/api/employees/${uid}`, config);
    return response.data;
  },
  updateEmployee: async (uid, data, config) => {
    const response = await api.put(`/api/employees/${uid}`, data, config);
    return response.data;
  },
};