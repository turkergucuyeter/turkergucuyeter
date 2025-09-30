import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await useAuthStore.getState().refresh();
        const token = useAuthStore.getState().accessToken;
        if (token) {
          error.config.headers = error.config.headers ?? {};
          error.config.headers.Authorization = `Bearer ${token}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
