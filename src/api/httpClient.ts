import axios from 'axios';
import { store } from '../store/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(
  (config) => {
    // Dynamically inject token from Redux store
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
