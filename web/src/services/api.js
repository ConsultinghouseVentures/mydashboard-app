// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export default {
  login: async (email, password) => {
    const response = await api.post('/api/login', { username: email, password });
    return response.data;
  },
  register: async (email, password, name) => {
    const response = await api.post('/api/register', { username: email, password, name });
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
};