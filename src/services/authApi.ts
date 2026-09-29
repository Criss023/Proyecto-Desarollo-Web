// src/services/authApi.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// URL de la instancia de API-RH asignada a tu grupo (Cloud Run), sin /api/v1.
// El docente la entrega por canal privado junto con las credenciales.
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '<API_BASE_URL_ASIGNADA>';

export const authApiClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Adjunta el access token a las rutas que lo requieren (/auth/me, /auth/logout).
// Login y refresh son públicas: todavía no hay token que enviar.
authApiClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const token = JSON.parse(authData)?.state?.user?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Si el JSON es inválido, lo ignoramos y la petición sigue sin token
    }
  }
  return config;
});

// Si el access token expiró a mitad de sesión, intenta renovarlo una vez con
// el refresh token y reintenta la petición original antes de rendirse.
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login')
      || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      // getState() lee el store fuera de un componente, sin necesidad del hook
      const newAccessToken = await useAuthStore.getState().refreshSession();

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authApiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
