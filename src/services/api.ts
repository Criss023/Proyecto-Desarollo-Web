// src/services/api.ts
import axios from 'axios';

// API mock local (JSON Server) para el CRUD de empleados de este mini-proyecto.
// No requiere autenticación: la sesión real contra API-RH vive por separado
// en authApi.ts / authService.ts (Clase 9), con su propio interceptor.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
