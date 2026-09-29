// src/pages/DashboardPage.tsx
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useHasRole } from '../components/RoleGuard';
import { useEmployees } from '../hooks/useEmployees';

const statVariants = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
  green: { bg: 'bg-green-100', text: 'text-green-800' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

function DashboardPage() {
  const userName = useAuthStore(state => state.user?.firstName) || 'invitado';
  const canManageEmployees = useHasRole(['ADMIN', 'HR_MANAGER']);
  // Mismos datos que EmployeesPage — TanStack Query comparte el cache entre
  // ambas pantallas, así que esto no dispara una petición nueva si ya se
  // cargó la lista sin filtros en otra vista.
  const { data } = useEmployees({});
  const employees = data?.data || [];
  const total = employees.length;
  const active = employees.filter(e => e.status === 'active').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;

  const stats = [
    { label: 'Total empleados', value: total, variant: 'blue' as const },
    { label: 'Activos', value: active, variant: 'green' as const },
    { label: 'En permiso', value: onLeave, variant: 'yellow' as const },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h2>
      <p className="text-slate-500 mb-6">Bienvenido, {userName}</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {stats.map(stat => {
          const style = statVariants[stat.variant];
          return (
            <div
              key={stat.label}
              className={`flex-1 min-w-40 p-6 rounded-xl ${style.bg} hover:shadow-lg transition-shadow duration-200`}
            >
              <p className={`mb-1 text-sm ${style.text}`}>{stat.label}</p>
              <p className={`text-4xl font-bold ${style.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {canManageEmployees && (
        <div className="flex gap-3">
          <Link
            to="/empleados"
            className="px-5 py-2.5 bg-brand-800 hover:bg-brand-700 text-white rounded-lg text-sm transition-colors"
          >
            Ver empleados →
          </Link>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
