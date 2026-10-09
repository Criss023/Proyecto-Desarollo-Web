import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { complianceService } from '../services/complianceService';
import type { MissingDocumentSummary } from '../services/complianceService';

function CompliancePage() {
  const { isAuthenticated, user } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['compliance-report'],
    queryFn: () => complianceService.getReport(),
    enabled: isAuthenticated && !!user?.accessToken,
  });

  const complianceValue = data ? parseFloat(data.compliancePercentage) : 0;

  const complianceColor =
    complianceValue >= 80
      ? 'border-green-500'
      : complianceValue >= 50
      ? 'border-yellow-500'
      : 'border-red-400';

  const progressColor =
    complianceValue >= 80
      ? 'bg-green-500'
      : complianceValue >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Cumplimiento documental</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Resumen del estado de expedientes en la organizacion
        </p>
      </div>

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">
            No se pudo cargar el reporte de cumplimiento
          </p>
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20" aria-busy="true">
          <svg className="animate-spin w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm text-slate-400">Cargando reporte...</span>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-5 border-l-4 border-primary-500">
              <p className="text-sm text-slate-500 mb-1">Total empleados</p>
              <p className="text-3xl font-bold text-slate-900">{data.totalEmployees}</p>
              <p className="text-xs text-slate-400 mt-1">
                {data.requiredDocumentTypes} tipos requeridos
              </p>
            </div>
            <div className="card p-5 border-l-4 border-green-500">
              <p className="text-sm text-slate-500 mb-1">Completos</p>
              <p className="text-3xl font-bold text-slate-900">{data.completeEmployees}</p>
              <p className="text-xs text-slate-400 mt-1">Expediente completo</p>
            </div>
            <div className="card p-5 border-l-4 border-yellow-500">
              <p className="text-sm text-slate-500 mb-1">En progreso</p>
              <p className="text-3xl font-bold text-slate-900">{data.inProgressEmployees}</p>
              <p className="text-xs text-slate-400 mt-1">Documentos parciales</p>
            </div>
            <div className={`card p-5 border-l-4 ${complianceColor}`}>
              <p className="text-sm text-slate-500 mb-1">Cumplimiento</p>
              <p className="text-3xl font-bold text-slate-900">
                {complianceValue.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Tasa general</p>
            </div>
          </div>

          <div className="card p-5 mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>{data.completeEmployees} completos</span>
              <span>{data.incompleteEmployees} incompletos</span>
            </div>
            <div
              className="w-full bg-slate-200 rounded-full h-3 overflow-hidden"
              role="progressbar"
              aria-valuenow={complianceValue}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Cumplimiento documental: ${complianceValue.toFixed(1)}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${complianceValue}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Generado: {new Date(data.generatedAt).toLocaleString('es-GT')}
            </p>
          </div>

          {data.missingRequiredDocuments.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">
                  Documentos requeridos con mayor incumplimiento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tipos de documento que mas empleados tienen pendientes
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">
                        Codigo
                      </th>
                      <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">
                        Tipo de documento
                      </th>
                      <th scope="col" className="text-right px-5 py-3 font-medium text-slate-600">
                        Empleados sin el
                      </th>
                      <th scope="col" className="text-right px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">
                        Porcentaje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.missingRequiredDocuments.map((item: MissingDocumentSummary) => {
                      const pct = data.totalEmployees > 0
                        ? ((item.missingCount / data.totalEmployees) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <tr key={item.documentTypeId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {item.code}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="badge badge-red">
                              {item.missingCount}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500 hidden sm:table-cell">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.missingRequiredDocuments.length === 0 && (
            <div className="card p-12 text-center" role="status">
              <p className="text-slate-400 text-sm">
                Todos los documentos requeridos estan cubiertos.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CompliancePage;