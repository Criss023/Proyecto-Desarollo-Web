import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { alertService } from '../services/alertService';
import type { DocumentAlert } from '../services/alertService';
import { useHasRole } from '../components/RoleGuard';

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critica',
  HIGH: 'Alta',
  WARNING: 'Advertencia',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'badge-red',
  HIGH: 'badge-yellow',
  WARNING: 'badge-blue',
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  EXPIRED_DOCUMENT: 'Documento vencido',
  MISSING_REQUIRED_DOCUMENT: 'Documento requerido faltante',
  DOCUMENT_EXPIRING: 'Documento por vencer',
};

function AlertsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = useHasRole(['ADMIN']);
  const [severityFilter, setSeverityFilter] = useState('');
  const [syncResult, setSyncResult] = useState<{ processedEmployees: number; updatedEmployees: number } | null>(null);

  const queryEnabled = isAuthenticated && !!user?.accessToken;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['alerts', severityFilter],
    queryFn: () => alertService.list({ severity: severityFilter || undefined }),
    enabled: queryEnabled,
  });

  const items: DocumentAlert[] = data?.items ?? data ?? [];

  const syncMutation = useMutation({
    mutationFn: () => alertService.sync(),
    onSuccess: (result) => {
      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Alertas documentales</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Cargando...' : `${items.length} alertas activas`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="input-field w-auto"
            aria-label="Filtrar por severidad"
          >
            <option value="">Todas las severidades</option>
            <option value="CRITICAL">Critica</option>
            <option value="HIGH">Alta</option>
            <option value="WARNING">Advertencia</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
            >
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar alertas'}
            </button>
          )}
        </div>
      </div>

      {syncResult && (
        <div className="card p-4 border-l-4 border-green-400 mb-5" role="status">
          <p className="text-sm text-green-700">
            Sincronizacion completada: {syncResult.processedEmployees} empleados procesados, {syncResult.updatedEmployees} actualizados.
          </p>
        </div>
      )}

      {syncMutation.isError && (
        <div className="card p-4 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm text-red-700">Error al sincronizar. Intenta nuevamente.</p>
        </div>
      )}

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">No se pudieron cargar las alertas</p>
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">Reintentar</button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20" aria-busy="true">
          <svg className="animate-spin w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm text-slate-400">Cargando alertas...</span>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-12 text-center" role="status">
          <p className="text-slate-400 text-sm">No hay alertas activas.</p>
          <p className="text-xs text-slate-300 mt-1">Todos los expedientes estan en orden.</p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-3">
          {items.map((alert: DocumentAlert, index: number) => (
            <div
              key={index}
              className="card p-4"
              role="article"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge ${SEVERITY_COLORS[alert.severity] ?? 'badge-gray'}`}>
                      {SEVERITY_LABELS[alert.severity] ?? alert.severity}
                    </span>
                    <span className="badge badge-gray">
                      {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900 text-sm">
                    {alert.employee.firstName} {alert.employee.lastName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {alert.organization.departmentName} · {alert.organization.branchName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Documento: {alert.documentType.name}
                  </p>
                  {alert.expiresAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vence: {new Date(alert.expiresAt).toLocaleDateString('es-GT')}
                      {alert.daysUntilExpiration !== undefined && (
                        <span className="ml-1">
                          ({alert.daysUntilExpiration > 0
                            ? `en ${alert.daysUntilExpiration} dias`
                            : 'vencido'})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertsPage;