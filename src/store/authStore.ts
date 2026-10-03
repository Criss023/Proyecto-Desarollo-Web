import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import type { AuthUser, LoginCredentials } from '../types';

let refreshInFlight: Promise<string | null> | null = null;

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login(credentials);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: { message?: string } } } })
              ?.response?.data?.error?.message ?? 'Credenciales incorrectas o API no disponible.';
          set({ error: message, isLoading: false });
        }
      },

      logout: async () => {
        const refreshToken = get().user?.refreshToken;
        if (refreshToken) {
          try {
            await authService.logout(refreshToken);
          } catch {
            // Si falla el logout en el servidor, igual limpiamos local
          }
        }
        set({ user: null, isAuthenticated: false, error: null });
      },

      refreshSession: async () => {
        if (refreshInFlight) return refreshInFlight;

        const refreshToken = get().user?.refreshToken;
        if (!refreshToken) {
          set({ user: null, isAuthenticated: false });
          return null;
        }

        refreshInFlight = authService
          .refresh(refreshToken)
          .then(({ accessToken, refreshToken: newRefresh }) => {
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  accessToken,
                  refreshToken: newRefresh,
                },
                isAuthenticated: true,
              });
            }
            return accessToken;
          })
          .catch(() => {
            set({ user: null, isAuthenticated: false });
            return null;
          })
          .finally(() => {
            refreshInFlight = null;
          });

        return refreshInFlight;
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Interceptor: adjunta el token a cada peticion autenticada
apiClient.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().user?.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // continua sin token
  }
  return config;
});

// Interceptor: si recibe 401 intenta renovar el token una vez
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const newToken = await useAuthStore.getState().refreshSession();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  }
);