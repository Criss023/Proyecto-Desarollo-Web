import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getAccessToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    return JSON.parse(stored)?.state?.user?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    return JSON.parse(stored)?.state?.user?.refreshToken ?? null;
  } catch {
    return null;
  }
};