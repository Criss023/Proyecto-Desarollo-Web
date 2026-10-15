import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { selfServiceService } from '../services/selfServiceService';
import type { SelfServiceDocument } from '../services/selfServiceService';

function MyDocumentsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-documents'],
    queryFn: () => selfServiceService.listDocuments(),
    enabled: isAuthenticated && !!user?.accessToken,
  });

  const docs: SelfServiceDocument[] = data?.items ?? data ?? [];

  const downloadMutation = useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      selfServiceService.downloadDocument(id, fileName),
    onMutate: ({ id }) => setDownloadingId(id),
    onSettled: () => setDownloadingId(null),
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Mis documentos</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Documentos de tu expediente digital
        </p>
      </div>

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">
            No se pudieron cargar tus documentos
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
          <span className="text-sm text-slate-400">Cargando documentos...</span>
        </div>
      )}

      {!isLoading && !isError && docs.length === 0 && (
        <div className="card p-12 text-center" role="status">
          <p className="text-slate-400 text-sm">No tienes documentos en tu expediente.</p>
          <p className="text-xs text-slate-300 mt-1">
            Contacta a RRHH si crees que deberia haber documentos aqui.
          </p>
        </div>
      )}

      {!isLoading && !isError && docs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm text-slate-500">{docs.length} documentos en tu expediente</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">
                    Documento
                  </th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">
                    Tipo
                  </th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">
                    Vencimiento
                  </th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">
                    Accion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc: SelfServiceDocument) => {
                  const isExpired = doc.expiresAt
                    ? new Date(doc.expiresAt) < new Date()
                    : false;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{doc.originalName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatSize(doc.sizeBytes)}
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="text-slate-700">{doc.documentType.name}</div>
                        <span className="font-mono text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          {doc.documentType.code}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {doc.expiresAt ? (
                          <span className={`badge ${isExpired ? 'badge-red' : 'badge-green'}`}>
                            {isExpired ? 'Vencido: ' : ''}
                            {new Date(doc.expiresAt).toLocaleDateString('es-GT')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin vencimiento</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() =>
                            downloadMutation.mutate({
                              id: doc.id,
                              fileName: doc.originalName,
                            })
                          }
                          disabled={downloadingId === doc.id}
                          className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-medium focus:outline-none disabled:opacity-50"
                          aria-label={`Descargar ${doc.originalName}`}
                        >
                          {downloadingId === doc.id ? 'Descargando...' : 'Descargar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyDocumentsPage;