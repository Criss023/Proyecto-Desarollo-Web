// src/services/authService.ts
import { authApiClient } from './authApi';
import type { AuthUser, AuthUserRole, LoginCredentials } from '../types';

// Formas exactas del contrato real de API-RH (POST /api/v1/auth/login y
// /api/v1/auth/refresh), tomadas de openapi.json — AuthResponseDto.
interface CurrentUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: AuthUserRole;
}

interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface AuthResponseDto {
  user: CurrentUserDto;
  tokens: TokenPairDto;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

function toAuthUser({ user, tokens }: AuthResponseDto): AuthUser {
  return {
    ...user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// Decodifica el payload de un JWT (sin verificar la firma: eso solo lo puede
// hacer el servidor, que conoce el secreto con el que se firmó).
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Verifica si el access token ya expiró (claim estándar "exp", en segundos).
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() / 1000 > payload.exp;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await authApiClient.post<Envelope<AuthResponseDto>>('/api/v1/auth/login', credentials);
    return toAuthUser(response.data.data);
  },

  // Rota ambos tokens: el refresh token usado queda invalidado de inmediato.
  refresh: async (refreshToken: string): Promise<AuthUser> => {
    const response = await authApiClient.post<Envelope<AuthResponseDto>>('/api/v1/auth/refresh', { refreshToken });
    return toAuthUser(response.data.data);
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      await authApiClient.post('/api/v1/auth/logout', { refreshToken });
    } catch {
      // Si falla (p. ej. el refresh token ya expiró), no importa:
      // la sesión local se limpia igual desde el store.
    }
  },

  me: async (): Promise<CurrentUserDto> => {
    const response = await authApiClient.get<Envelope<CurrentUserDto>>('/api/v1/auth/me');
    return response.data.data;
  },
};
