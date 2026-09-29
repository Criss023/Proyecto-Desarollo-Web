// src/components/RoleGuard.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { AuthRole } from '../types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AuthRole[];
  fallback?: ReactNode; // Qué mostrar si no tiene el rol (en lugar de redirigir)
}

function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role.code)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="text-5xl mb-4">🚫</span>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Acceso restringido</h2>
        <p className="text-slate-500 max-w-md">
          No tienes permisos para acceder a esta sección. Contacta al administrador si crees que es un error.
        </p>
        <a href="/dashboard" className="mt-4 text-blue-600 hover:underline text-sm">
          Volver al Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook utilitario para verificar rol en cualquier componente
export function useHasRole(roles: AuthRole[]): boolean {
  const user = useAuthStore(state => state.user);
  return !!user && roles.includes(user.role.code);
}

export default RoleGuard;
