import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { expedienteService, documentTypeService } from '../services/documentService';

const MAX_MB = 2;
const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  VALID:          { label: 'Vigente',       cls: 'badge-green'  },
  EXPIRING_SOON:  { label: 'Por vencer',    cls: 'badge-yellow' },
  EXPIRED:        { label: 'Vencido',       cls: 'badge-red'    },
};

function EmployeeRecordsPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadTypeId, setUploadTypeId] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [fileError, setFileError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => employeeService.getById(employeeId!),
    enabled: !!employeeId,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['expediente', employeeId],
    queryFn: () => expedienteService.listByEmployee(employeeId!),
    enabled: !!employeeId,
  });

  const { data: docTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: documentTypeService.list,
  });

  const { data: validation, isLoading: loadingVal } = useQuery({
    queryKey: ['expediente-validation', employeeId],
    queryFn: () => expedienteService.validate(employeeId!),
    enabled: !!employeeId,
  });

  const uploadMutation = useMutation({
    mutationFn: () => expedienteService.upload(employeeId!, uploadTypeId, selectedFile!, uploadExpiry || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expediente', employeeId] });
      qc.invalidateQueries({ queryKey: ['expediente-validation', employeeId] });
      setSelectedFile(null);
      setUploadTypeId('');
      setUploadExpiry('');
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => expedienteService.delete(employeeId!, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expediente', employeeId] });
      qc.invalidateQueries({ queryKey: ['expediente-validation', employeeId] });
      setDeletingId(null);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError('');
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_MIME[file.type]) {
      setFileError(`Formato no permitido. Usa: ${Object.values(ALLOWED_MIME).join(', ')}`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`El archivo supera ${MAX_MB} MB`);
      return;
    }
    setSelectedFile(file);
  }

  const canUpload = uploadTypeId && selectedFile && !fileError;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link to="/empleados" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a empleados
      </Link>

      {/* Header */}
      {employee && (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-sm text-slate-500">{employee.employeeCode} · {employee.email}</p>
        </div>
      )}

      {/* Validation summary */}
      {!loadingVal && validation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Requeridos',   value: validation.totalRequired,     color: 'text-slate-700' },
            { label: 'Presentes',    value: validation.totalPresent,      color: 'text-green-700' },
            { label: 'Faltantes',    value: validation.totalMissing,      color: 'text-red-700'   },
            { label: 'Por vencer',   value: validation.totalExpiringSoon, color: 'text-yellow-700'},
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <div className="card p-4 mb-5">
        <h3 className="font-semibold text-slate-800 mb-3">Cargar documento</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-48 flex-1">
            <label className="label">Tipo de documento</label>
            <select
              value={uploadTypeId}
              onChange={(e) => setUploadTypeId(e.target.value)}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              {docTypes.filter(dt => dt.isActive).map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}{dt.isRequired ? ' *' : ''}</option>
              ))}
            </select>
          </div>
          <div className="min-w-40">
            <label className="label">Fecha de vencimiento</label>
            <input
              type="date"
              value={uploadExpiry}
              onChange={(e) => setUploadExpiry(e.target.value)}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="min-w-48 flex-1">
            <label className="label">Archivo (PDF, JPEG, PNG, DOC, DOCX · máx. 2 MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="input-field text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700"
            />
            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
          </div>
          <button
            disabled={!canUpload || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
        {uploadMutation.isError && (
          <p className="text-xs text-red-600 mt-2">
            Error al subir. Verifica el archivo e intenta de nuevo.
          </p>
        )}
      </div>

      {/* Documents table */}
      {loadingDocs ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Cargando expediente...</div>
      ) : documents.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">
          No hay documentos cargados aún.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Tamaño</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Cargado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Vence</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{doc.documentType.name}</div>
                      <div className="text-xs text-slate-400">{doc.fileName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                      {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {new Date(doc.uploadedAt).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString('es-GT') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_LABEL[doc.status]?.cls ?? 'badge-gray'}`}>
                        {STATUS_LABEL[doc.status]?.label ?? doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => expedienteService.download(employeeId!, doc.id, doc.fileName)}
                        className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                        title="Descargar"
                      >
                        Descargar
                      </button>
                      {deletingId === doc.id ? (
                        <span className="flex items-center gap-1 text-xs text-red-600">
                          <button
                            onClick={() => deleteMutation.mutate(doc.id)}
                            className="font-semibold hover:underline"
                          >Confirmar</button>
                          <button onClick={() => setDeletingId(null)} className="text-slate-400 hover:text-slate-600">Cancelar</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeletingId(doc.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missing documents */}
      {validation && validation.missingDocuments.length > 0 && (
        <div className="card p-4 mt-5 border-l-4 border-red-300">
          <p className="font-semibold text-red-700 text-sm mb-2">Documentos faltantes</p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
            {validation.missingDocuments.map((dt) => (
              <li key={dt.id}>{dt.name}{dt.isRequired ? ' (obligatorio)' : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EmployeeRecordsPage;