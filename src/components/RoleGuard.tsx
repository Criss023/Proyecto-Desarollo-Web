import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role?.code ?? '';

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Acceso restringido</h3>
          <p className="text-sm text-slate-500">
            No tienes permisos para ver esta seccion. Contacta al administrador si crees que es un error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useHasRole(allowedRoles: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  return allowedRoles.includes(user?.role?.code ?? '');
}

export default RoleGuard;