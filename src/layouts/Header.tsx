// src/layouts/Header.tsx
import { Link, useLocation } from 'react-router-dom';
import type { AuthUser, NavItem } from '../types';
import { useHasRole } from '../components/RoleGuard';

interface HeaderProps {
  user?: AuthUser;
  onLogout?: () => void;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', allowedRoles: ['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] },
  { path: '/empleados', label: 'Empleados', icon: '🧑‍💼', allowedRoles: ['ADMIN', 'HR_MANAGER'] },
];

function Header({ user, onLogout }: HeaderProps) {
  const { pathname } = useLocation();
  const canManageEmployees = useHasRole(['ADMIN', 'HR_MANAGER']);

  // Sección de UI oculta según rol: EMPLOYEE nunca ve el link a Empleados
  const visibleNavItems = navItems.filter(
    item => item.path !== '/empleados' || canManageEmployees
  );

  return (
    <header className="bg-brand-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">👥</span>
          <span className="font-bold text-xl tracking-tight">Mini RRHH</span>
        </div>

        {/* Navegación */}
        {user && (
          <nav className="hidden sm:flex items-center gap-1">
            {visibleNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${pathname.startsWith(item.path)
                    ? 'bg-white/20 text-white'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Usuario y logout */}
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-white/80">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full uppercase font-medium">
              {user.role.name}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-sm text-white/75 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-md transition-colors"
              >
                Salir
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
