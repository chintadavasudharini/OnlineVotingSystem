import axios from 'axios';
import { useAuthStore, isTokenExpired } from '../stores/authStore';

/**
 * Enterprise Axios REST Client for Online Voting System
 * Features automatic Bearer JWT injection, fallback token recovery, and synchronized error handling.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatic JWT Authorization header injection with fallback resolution
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('voting_auth_token');

    // Fallback 1: Extract from voting_auth_session if voting_auth_token was absent
    if (!token) {
      try {
        const raw = localStorage.getItem('voting_auth_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          const state = parsed.state || parsed;
          token = state.token || null;
          if (token) {
            localStorage.setItem('voting_auth_token', token);
          }
        }
      } catch {}
    }

    // Fallback 2: Extract from Zustand store state directly
    if (!token) {
      token = useAuthStore.getState().token;
      if (token) {
        localStorage.setItem('voting_auth_token', token);
      }
    }

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
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    // Only trigger store logout if an authenticated request failed with 401 Unauthorized,
    // was not the login endpoint itself, and the token is genuinely missing or expired.
    if (error.response?.status === 401 && !isLoginEndpoint && error.config?.headers?.Authorization) {
      const token = useAuthStore.getState().token;
      if (!token || isTokenExpired(token)) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
