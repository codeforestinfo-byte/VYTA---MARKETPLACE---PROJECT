import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('vyta_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vyta_admin_token');
      localStorage.removeItem('vyta_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
