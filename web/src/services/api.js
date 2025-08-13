// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
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
    const response = await api.post('/login', { username: email, password });
    return response.data;
  },
  register: async (email, password, first_name, last_name) => {
    const response = await api.post('/register', { username: email, password, first_name, last_name });
    return response.data;
  },
  getProfile: async (config) => {
    const response = await api.get('/profile', config);
    return response.data;
  },
  updateProfile: async (data, config) => {
    const response = await api.put('/profile', data, config);
    return response.data;
  },
  changePassword: async (data, config) => {
    const response = await api.put('/change-password', data, config);
    return response.data;
  },
  getUsers: async (config) => {
    const response = await api.get('/users', config);
    return response.data;
  },
  getUser: async (uid, config) => {
    const response = await api.get(`/users/${uid}`, config);
    return response.data;
  },
  updateUser: async (uid, data, config) => {
    const response = await api.put(`/users/${uid}`, data, config);
    return response.data;
  },
  deleteUser: async (uid, config) => {
    const response = await api.delete(`/users/${uid}`, config);
    return response.data;
  },
  getEmployees: async (config) => {
    const response = await api.get('/employees', config);
    return response.data;
  },
  getEmployee: async (uid, config) => {
    const response = await api.get(`/employees/${uid}`, config);
    return response.data;
  },
  updateEmployee: async (uid, data, config) => {
    const response = await api.put(`/employees/${uid}`, data, config);
    return response.data;
  },
  get: async (url, config) => {
    const response = await api.get(url, config);
    return response.data;
  },
  post: async (url, data, config) => {
    const response = await api.post(url, data, config);
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
};