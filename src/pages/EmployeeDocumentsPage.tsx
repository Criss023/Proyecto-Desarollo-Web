import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { employeeDocumentService, validateFileClient } from '../services/employeeDocumentService';
import { employeeService } from '../services/employeeService';
import { documentTypeService } from '../services/documentTypeService';
import type { EmployeeDocument } from '../services/employeeDocumentService';
import type { DocumentType } from '../services/documentTypeService';

function EmployeeDocumentsPage() {
  const { id: employeeId } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showUpload, setShowUpload] = useState(false);
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryEnabled = isAuthenticated && !!user?.accessToken && !!employeeId;

  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeService.getById(employeeId!),
    enabled: queryEnabled,
  });

  const { data: docsData, isLoading: loadingDocs, isError: errorDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => employeeDocumentService.list(employeeId!),
    enabled: queryEnabled,
  });

  const { data: validation, refetch: refetchValidation } = useQuery({
    queryKey: ['record-validation', employeeId],
    queryFn: () => employeeDocumentService.getValidation(employeeId!),
    enabled: queryEnabled,
  });

  const { data: docTypesData } = useQuery({
    queryKey: ['document-types-all'],
    queryFn: () => documentTypeService.list(),
    enabled: queryEnabled,
  });

const docTypes = Array.isArray(docTypesData) ? docTypesData : (docTypesData?.items ?? []);
  const docs: EmployeeDocument[] = docsData?.items ?? docsData ?? [];

  const uploadMutation = useMutation({
    mutationFn: () => employeeDocumentService.upload(
      employeeId!,
      selectedFile!,
      documentTypeId,
      expiresAt || undefined
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['record-validation', employeeId] });
      setShowUpload(false);
      setSelectedFile(null);
      setDocumentTypeId('');
      setExpiresAt('');
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => employeeDocumentService.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['record-validation', employeeId] });
      setConfirmDeleteId(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => employeeDocumentService.syncValidation(employeeId!),
    onSuccess: () => {
      refetchValidation();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) setFileError(validateFileClient(file));
    else setFileError(null);
  };

  const handleUpload = () => {
    if (!selectedFile || !documentTypeId) return;
    if (fileError) return;
    uploadMutation.mutate();
  };

  const handleDownload = async (doc: EmployeeDocument) => {
    setDownloadingId(doc.id);
    try {
      await employeeDocumentService.download(doc.id, doc.fileName);
    } finally {
      setDownloadingId(null);
    }
  };

const selectedDocType = docTypes.find((t: DocumentType) => t.id === documentTypeId);
  const requiresExpiration = selectedDocType?.requiresExpiration ?? false;

  if (!employeeId) return null;

  return (
    <div>
      <nav aria-label="Ruta de navegacion" className="mb-4 text-sm text-slate-500 flex items-center gap-1">
        <Link to="/empleados" className="hover:text-primary-600 hover:underline">
          Empleados
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">
          {employee ? `${employee.firstName} ${employee.lastName}` : 'Expediente'}
        </span>
      </nav>

      {employee && (
        <div className="card p-5 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {employee.employeeCode} · {employee.position.name} · {employee.department.name}
              </p>
            </div>
            {validation && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`badge ${validation.isComplete ? 'badge-green' : 'badge-red'}`}>
                  {validation.isComplete
                    ? 'Expediente completo'
                    : `Incompleto (${validation.requiredDocuments.filter((d: { uploaded: boolean }) => !d.uploaded).length} pendientes)`
                  }
                </span>
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="text-xs text-slate-400 hover:text-slate-600 hover:underline focus:outline-none disabled:opacity-50"
                >
                  {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            Documentos {!loadingDocs && `(${docs.length})`}
          </h3>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-sm py-1.5 px-3"
          >
            Subir documento
          </button>
        </div>

        {loadingDocs && (
          <div className="flex items-center justify-center py-12 text-slate-400" aria-busy="true">
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Cargando documentos...</span>
          </div>
        )}

        {errorDocs && (
          <div className="p-5">
            <div className="card p-4 border-l-4 border-red-400" role="alert">
              <p className="text-sm font-medium text-red-700 mb-2">No se pudieron cargar los documentos</p>
              <button onClick={() => refetchDocs()} className="btn-secondary text-xs py-1.5 px-3">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loadingDocs && !errorDocs && docs.length === 0 && (
          <div className="text-center py-12 text-slate-400" role="status">
            <p className="text-sm">Este empleado no tiene documentos cargados.</p>
          </div>
        )}

        {!loadingDocs && !errorDocs && docs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Documento</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Subido</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell">Vence</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc) => {
                  const isExpired = doc.expiresAt ? new Date(doc.expiresAt) < new Date() : false;
                  const sizeKB = (doc.sizeBytes / 1024).toFixed(0);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{doc.documentType.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{doc.fileName} · {sizeKB} KB</div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden sm:table-cell text-xs">
                        {new Date(doc.uploadedAt).toLocaleDateString('es-GT')}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {doc.expiresAt ? (
                          <span className={`badge ${isExpired ? 'badge-red' : 'badge-green'}`}>
                            {isExpired ? 'Vencido: ' : ''}{new Date(doc.expiresAt).toLocaleDateString('es-GT')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin vencimiento</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="text-primary-600 hover:text-primary-800 hover:underline text-sm font-medium focus:outline-none disabled:opacity-50"
                            aria-label={`Descargar ${doc.fileName}`}
                          >
                            {downloadingId === doc.id ? 'Descargando...' : 'Descargar'}
                          </button>
                          {confirmDeleteId === doc.id ? (
                            <span className="flex items-center gap-1 text-xs">
                              <span className="text-red-600 font-medium">Confirmar?</span>
                              <button
                                onClick={() => deleteMutation.mutate(doc.id)}
                                className="text-red-600 font-bold hover:underline focus:outline-none"
                              >
                                Si
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-slate-500 hover:underline focus:outline-none"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(doc.id)}
                              className="text-red-500 hover:text-red-700 hover:underline text-sm focus:outline-none"
                              aria-label={`Eliminar ${doc.fileName}`}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

{validation && !validation.isComplete && (
  <div className="card p-5 border-l-4 border-orange-400" role="region" aria-label="Documentos pendientes">
    <h4 className="font-semibold text-orange-800 mb-3 text-sm">Documentos requeridos pendientes</h4>
    <ul className="space-y-1.5">
      {validation.missingDocuments.map((d: { documentType: { id: string; name: string } }) => (
        <li key={d.documentType.id} className="flex items-center gap-2 text-sm text-orange-700">
          <span className="w-2 h-2 rounded-full bg-orange-300" aria-hidden="true" />
          {d.documentType.name}
        </li>
      ))}
    </ul>
  </div>
)}

      {showUpload && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Subir documento"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Subir documento</h3>
              <button
                onClick={() => { setShowUpload(false); setSelectedFile(null); setFileError(null); setDocumentTypeId(''); setExpiresAt(''); }}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {uploadMutation.isError && (
                <div className="card p-3 border-l-4 border-red-400" role="alert">
                  <p className="text-sm text-red-700">Error al subir el documento. Intenta nuevamente.</p>
                </div>
              )}

              <div>
                <label htmlFor="docType" className="label">
                  Tipo de documento <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select
                  id="docType"
                  value={documentTypeId}
                  onChange={e => setDocumentTypeId(e.target.value)}
                  className="input-field"
                  aria-required="true"
                >
                  <option value="">Selecciona un tipo...</option>
                  {docTypes.map((t: DocumentType) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.isRequired ? ' *' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fileInput" className="label">
                  Archivo <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="ml-1 text-xs text-slate-400 font-normal">PDF, JPEG, PNG, DOC, DOCX - max 2 MB</span>
                </label>
                <input
                  id="fileInput"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  aria-required="true"
                />
                {fileError && (
                  <p className="error-message" role="alert">{fileError}</p>
                )}
              </div>

              <div>
                <label htmlFor="expiresAt" className="label">
                  Fecha de vencimiento
                  {requiresExpiration && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                  {!requiresExpiration && <span className="ml-1 text-xs text-slate-400 font-normal">(opcional)</span>}
                </label>
                <input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                  aria-required={requiresExpiration}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => { setShowUpload(false); setSelectedFile(null); setFileError(null); setDocumentTypeId(''); setExpiresAt(''); }}
                disabled={uploadMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !selectedFile || !documentTypeId || !!fileError}
                className="btn-primary min-w-24"
              >
                {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDocumentsPage;