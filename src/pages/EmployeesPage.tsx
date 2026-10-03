import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { employeeService } from '../services/employeeService';
import type { EmployeeFilters } from '../services/employeeService';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-gray',
  SUSPENDED: 'badge-yellow',
  RETIRED: 'badge-gray',
};

const PAGE_SIZE = 10;

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
  if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
  return <span className="text-primary-500 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

function EmployeesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [search, setSearch]       = useState('');
  const [departmentId, setDept]   = useState('');
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filters: EmployeeFilters = {
    search:       search || undefined,
    departmentId: departmentId || undefined,
    status:       status || undefined,
    page,
    limit:        PAGE_SIZE,
    sortBy:       sortBy || undefined,
    sortOrder:    sortBy ? sortOrder : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeService.list(filters),
    enabled: isAuthenticated && !!user?.accessToken,
  });

  const { data: catalogs } = useQuery({
    queryKey: ['employee-catalogs'],
    queryFn: () => employeeService.getCatalogs(),
    enabled: isAuthenticated && !!user?.accessToken,
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const meta  = data?.meta;
  const total = meta?.totalItems ?? 0;
  const pages = meta?.totalPages ?? 1;

  function resetPage() { setPage(1); }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    resetPage();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Empleados</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Cargando...' : `${total} empleados encontrados`}
          </p>
        </div>
      </div>

      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label htmlFor="search" className="label">Buscar</label>
          <input
            id="search"
            type="search"
            placeholder="Nombre, email o codigo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="input-field"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="dept" className="label">Departamento</label>
          <select
            id="dept"
            value={departmentId}
            onChange={(e) => { setDept(e.target.value); resetPage(); }}
            className="input-field"
          >
            <option value="">Todos</option>
            {catalogs?.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="min-w-36">
          <label htmlFor="status" className="label">Estado</label>
          <select
            id="status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); resetPage(); }}
            className="input-field"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="RETIRED">Retirado</option>
          </select>
        </div>

        {(search || departmentId || status) && (
          <button
            onClick={() => { setSearch(''); setDept(''); setStatus(''); resetPage(); }}
            className="btn-danger py-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">No se pudieron cargar los empleados</p>
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20" aria-busy="true">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Cargando empleados...</span>
          </div>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-12 text-center" role="status">
          <p className="text-slate-400 text-sm">No se encontraron empleados con los filtros aplicados.</p>
        </div>
      )}

     {!isLoading && !isError && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-slate-600">
                    <button
                      onClick={() => toggleSort('firstName')}
                      className="flex items-center hover:text-slate-900 focus:outline-none"
                      aria-sort={sortBy === 'firstName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Empleado <SortIcon field="firstName" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">
                    Departamento
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">
                    Puesto
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-slate-600">
                    Estado
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-slate-600">
                    Expediente
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {emp.employeeCode} · {emp.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {emp.department.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {emp.position.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[emp.status] ?? 'badge-gray'}`}>
                        {STATUS_LABELS[emp.status] ?? emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/empleados/${emp.id}/documentos`}
                        className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-medium focus:outline-none focus:underline"
                        aria-label={`Ver expediente de ${emp.firstName} ${emp.lastName}`}
                      >
                        Ver expediente
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2">
              <p className="text-xs text-slate-500">
                Pagina {page} de {pages} · {total} empleados
              </p>
              <div className="flex gap-1" role="navigation" aria-label="Paginacion">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs py-1.5 px-3"
                  aria-label="Pagina anterior"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`text-xs py-1.5 px-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                        p === page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      aria-current={p === page ? 'page' : undefined}
                      aria-label={`Pagina ${p}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-secondary text-xs py-1.5 px-3"
                  aria-label="Pagina siguiente"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;