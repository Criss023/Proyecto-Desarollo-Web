import { useAuthStore } from '../store/authStore';
import { useHasRole } from '../components/RoleGuard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import type { ApiEnvelope } from '../types';

interface DashboardData {
  workforce: {
    total: number;
    active: number;
    suspended: number;
    retired: number;
  };
  records: {
    complete: number;
    inProgress: number;
    incomplete: number;
    compliancePercentage: string;
  };
  leaveRequests: {
    pending: number;
    upcomingApproved: number;
  };
  documents: {
    expired: number;
    expiringNext30Days: number;
  };
  latestPayrollPeriod?: {
    id: string;
    name: string;
    status: string;
    paymentDate: string;
    employeeCount: number;
  };
  generatedAt: string;
}

interface SelfServiceProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: { id: string; name: string };
  department: { id: string; name: string };
  branch: { id: string; name: string };
  status: string;
  hireDate: string;
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`card p-5 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<DashboardData>>(
        '/api/v1/reports/dashboard'
      );
      return res.data.data;
    },
    enabled: isAuthenticated && !!user?.accessToken,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true" aria-label="Cargando dashboard">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 border-l-4 border-red-400 max-w-lg" role="alert">
        <p className="text-sm font-medium text-red-700 mb-1">No se pudo cargar el dashboard</p>
        <p className="text-xs text-slate-500 mb-3">Verifica tu conexion o que tu rol tenga acceso.</p>
        <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

    return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Fuerza laboral
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total empleados"
            value={data.workforce.total}
            sub={`${data.workforce.active} activos`}
            color="border-primary-500"
          />
          <StatCard
            label="Activos"
            value={data.workforce.active}
            color="border-green-500"
          />
          <StatCard
            label="Suspendidos"
            value={data.workforce.suspended}
            color="border-yellow-500"
          />
          <StatCard
            label="Retirados"
            value={data.workforce.retired}
            color="border-slate-400"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Expedientes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Completos"
            value={data.records.complete}
            color="border-green-500"
          />
          <StatCard
            label="En progreso"
            value={data.records.inProgress}
            color="border-yellow-500"
          />
          <StatCard
            label="Cumplimiento"
            value={`${parseFloat(data.records.compliancePercentage).toFixed(1)}%`}
            color="border-primary-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Documentos y permisos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Documentos vencidos"
            value={data.documents.expired}
            color={data.documents.expired > 0 ? 'border-red-400' : 'border-slate-300'}
          />
          <StatCard
            label="Vencen en 30 dias"
            value={data.documents.expiringNext30Days}
            color="border-yellow-500"
          />
          <StatCard
            label="Permisos pendientes"
            value={data.leaveRequests.pending}
            color="border-orange-400"
          />
          <StatCard
            label="Proximos aprobados"
            value={data.leaveRequests.upcomingApproved}
            color="border-green-500"
          />
        </div>
      </div>
    </div>
  );
}

function EmployeeHome() {
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['self-service-profile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiEnvelope<SelfServiceProfile>>(
        '/api/v1/self-service/profile'
      );
      return res.data.data;
    },
    enabled: isAuthenticated && !!user?.accessToken,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 border-l-4 border-orange-400 max-w-lg" role="alert">
        <p className="text-sm font-medium text-orange-700 mb-1">Perfil no disponible</p>
        <p className="text-xs text-slate-500">
          Tu cuenta no esta vinculada a un perfil de empleado. Contacta al administrador.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const fields = [
    { label: 'Codigo', value: data.employeeCode },
    { label: 'Correo', value: data.email },
    { label: 'Telefono', value: data.phone ?? 'No registrado' },
    { label: 'Puesto', value: data.position.name },
    { label: 'Departamento', value: data.department.name },
    { label: 'Sede', value: data.branch.name },
    { label: 'Estado', value: data.status },
    {
      label: 'Fecha de ingreso',
      value: new Date(data.hireDate).toLocaleDateString('es-GT'),
    },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary-700">
              {data.firstName[0]}{data.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {data.firstName} {data.lastName}
            </h3>
            <p className="text-sm text-slate-400">{data.position.name}</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-slate-400 mb-0.5">{label}</dt>
              <dd className="text-sm font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdminOrHR = useHasRole(['ADMIN', 'HR_MANAGER']);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.accessToken) {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['self-service-profile'] });
    }
  }, [user?.accessToken, queryClient]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {isAdminOrHR ? 'Dashboard' : 'Mi portal'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>
      {isAdminOrHR ? <AdminDashboard /> : <EmployeeHome />}
    </div>
  );
}

export default DashboardPage;