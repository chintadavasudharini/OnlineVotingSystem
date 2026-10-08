import axios from 'axios';

/**
 * Enterprise Axios REST Client for Online Voting System
 * Features automatic Bearer JWT injection and standardized response error handling.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatic JWT Authorization header injection
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voting_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified exception handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('voting_auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;
