import { apiClient } from './apiClient';
import type { ApiEnvelope, AuthUser, LoginCredentials } from '../types';

interface LoginResponseData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    role: { code: string; name: string };
  };
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const res = await apiClient.post<ApiEnvelope<LoginResponseData>>(
      '/api/v1/auth/login',
      credentials
    );
    const { user, accessToken, refreshToken } = res.data.data;
    return { ...user, accessToken, refreshToken };
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await apiClient.post<ApiEnvelope<RefreshResponseData>>(
      '/api/v1/auth/refresh',
      { refreshToken }
    );
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  },

  me: async (accessToken: string): Promise<AuthUser['id']> => {
    const res = await apiClient.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.data;
  },
};