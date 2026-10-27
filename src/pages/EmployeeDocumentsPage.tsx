import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import {
  employeeDocumentService,
  validateFileClient,
  validateFileMagic,
  validateFileBlank,
} from "../services/employeeDocumentService";
import { employeeService } from "../services/employeeService";
import { documentTypeService } from "../services/documentTypeService";
import type { EmployeeDocument } from "../services/employeeDocumentService";
import type { DocumentType } from "../services/documentTypeService";

const UNIQUE_DOC_CODES = new Set([
  "CRIMINAL_RECORD",
  "POLICE_RECORD",
  "CONTRACT",
  "DPI",
]);

function EmployeeDocumentsPage() {
  const { id: employeeId } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showUpload, setShowUpload] = useState(false);
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileChecking, setFileChecking] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryEnabled = isAuthenticated && !!user?.accessToken && !!employeeId;

  const { data: employee } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => employeeService.getById(employeeId!),
    enabled: queryEnabled,
  });

  const {
    data: docsData,
    isLoading: loadingDocs,
    isError: errorDocs,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ["employee-documents", employeeId],
    queryFn: () => employeeDocumentService.list(employeeId!),
    enabled: queryEnabled,
  });

  const { data: validation, refetch: refetchValidation } = useQuery({
    queryKey: ["record-validation", employeeId],
    queryFn: () => employeeDocumentService.getValidation(employeeId!),
    enabled: queryEnabled,
  });

  const { data: docTypesData } = useQuery({
    queryKey: ["document-types-all"],
    queryFn: () => documentTypeService.list(),
    enabled: queryEnabled,
  });

  const docTypes: DocumentType[] = Array.isArray(docTypesData)
    ? docTypesData
    : (docTypesData?.items ?? []);
  const docs: EmployeeDocument[] = docsData?.items ?? docsData ?? [];

  const selectedDocType = docTypes.find((t) => t.id === documentTypeId);
  const requiresExpiration = selectedDocType?.requiresExpiration ?? false;

  // Detecta si ya existe un doc del mismo tipo (para tipos únicos)
  const existingDoc = documentTypeId
    ? docs.find((d) => d.documentType.id === documentTypeId)
    : undefined;
  const isUniqueType = selectedDocType
    ? UNIQUE_DOC_CODES.has(selectedDocType.code ?? "")
    : false;
  const needsReplaceConfirmation = !!(
    existingDoc &&
    isUniqueType &&
    !replaceConfirmed
  );

  const closeUpload = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setFileError(null);
    setUploadError(null);
    setDocumentTypeId("");
    setExpiresAt("");
    setReplaceConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Si es reemplazo, primero elimina el doc anterior
      if (existingDoc && isUniqueType && replaceConfirmed) {
        await employeeDocumentService.delete(existingDoc.id);
      }
      return employeeDocumentService.upload(
        employeeId!,
        selectedFile!,
        documentTypeId,
        expiresAt || undefined,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-documents", employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["record-validation", employeeId],
      });
      setUploadError(null);
      closeUpload();
    },
    onError: (err: {
      response?: { data?: { message?: string | string[] } };
    }) => {
      const msg = err.response?.data?.message;
      setUploadError(
        Array.isArray(msg)
          ? msg.join(". ")
          : (msg ?? "Error al subir el documento. Intenta nuevamente."),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      employeeDocumentService.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-documents", employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["record-validation", employeeId],
      });
      setConfirmDeleteId(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => employeeDocumentService.syncValidation(employeeId!),
    onSuccess: () => {
      refetchValidation();
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setSelectedFile(file);
  setFileError(null);
  if (!file) return;

  const basicError = validateFileClient(file);
  if (basicError) { setFileError(basicError); return; }

  setFileChecking(true);
  const magicError = await validateFileMagic(file);
  if (magicError) { setFileChecking(false); setFileError(magicError); return; }

  const blankError = await validateFileBlank(file);
  setFileChecking(false);
  setFileError(blankError);
};

  const handleUpload = () => {
    if (!selectedFile || !documentTypeId || fileError) return;
    if (needsReplaceConfirmation) return; // no debería llegar aquí, pero por seguridad
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

  if (!employeeId) return null;

  return (
    <div>
      <nav
        aria-label="Ruta de navegacion"
        className="mb-4 text-sm text-slate-500 flex items-center gap-1"
      >
        <Link
          to="/empleados"
          className="hover:text-primary-600 hover:underline"
        >
          Empleados
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">
          {employee
            ? `${employee.firstName} ${employee.lastName}`
            : "Expediente"}
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
                {employee.employeeCode} · {employee.position.name} ·{" "}
                {employee.department.name}
              </p>
            </div>
            {validation && (
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`badge ${validation.isComplete ? "badge-green" : "badge-red"}`}
                >
                  {validation.isComplete
                    ? "Expediente completo"
                    : `Incompleto (${validation.requiredDocuments.filter((d: { uploaded: boolean }) => !d.uploaded).length} pendientes)`}
                </span>
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="text-xs text-slate-400 hover:text-slate-600 hover:underline focus:outline-none disabled:opacity-50"
                >
                  {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
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
          <div
            className="flex items-center justify-center py-12 text-slate-400"
            aria-busy="true"
          >
            <svg
              className="animate-spin w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-sm">Cargando documentos...</span>
          </div>
        )}

        {errorDocs && (
          <div className="p-5">
            <div className="card p-4 border-l-4 border-red-400" role="alert">
              <p className="text-sm font-medium text-red-700 mb-2">
                No se pudieron cargar los documentos
              </p>
              <button
                onClick={() => refetchDocs()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loadingDocs && !errorDocs && docs.length === 0 && (
          <div className="text-center py-12 text-slate-400" role="status">
            <p className="text-sm">
              Este empleado no tiene documentos cargados.
            </p>
          </div>
        )}

        {!loadingDocs && !errorDocs && docs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-medium text-slate-600"
                  >
                    Documento
                  </th>
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell"
                  >
                    Subido
                  </th>
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-medium text-slate-600 hidden md:table-cell"
                  >
                    Vence
                  </th>
                  <th
                    scope="col"
                    className="text-left px-5 py-3 font-medium text-slate-600"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc) => {
                  const isExpired = doc.expiresAt
                    ? new Date(doc.expiresAt) < new Date()
                    : false;
                  const sizeKB = (doc.sizeBytes / 1024).toFixed(0);
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">
                          {doc.documentType.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {doc.fileName} · {sizeKB} KB
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 hidden sm:table-cell text-xs">
                        {new Date(doc.uploadedAt).toLocaleDateString("es-GT")}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {doc.expiresAt ? (
                          <span
                            className={`badge ${isExpired ? "badge-red" : "badge-green"}`}
                          >
                            {isExpired ? "Vencido: " : ""}
                            {new Date(doc.expiresAt).toLocaleDateString(
                              "es-GT",
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin vencimiento
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="btn-primary text-xs py-1 px-2.5 disabled:opacity-50"
                            aria-label={`Descargar ${doc.fileName}`}
                          >
                            {downloadingId === doc.id
                              ? "Descargando..."
                              : "Descargar"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(doc.id)}
                            className="btn-danger text-xs py-1 px-2.5"
                            aria-label={`Eliminar ${doc.fileName}`}
                          >
                            Eliminar
                          </button>
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
        <div
          className="card p-5 border-l-4 border-orange-400"
          role="region"
          aria-label="Documentos pendientes"
        >
          <h4 className="font-semibold text-orange-800 mb-3 text-sm">
            Documentos requeridos pendientes
          </h4>
          <ul className="space-y-1.5">
            {validation.requiredDocuments
              .filter((d: { uploaded: boolean }) => !d.uploaded)
              .map((d: { documentType: { id: string; name: string } }) => (
                <li
                  key={d.documentType.id}
                  className="flex items-center gap-2 text-sm text-orange-700"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-orange-300"
                    aria-hidden="true"
                  />
                  {d.documentType.name}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Eliminar documento
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                ¿Estás seguro que deseas eliminar este documento del expediente?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 min-w-24"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
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
                onClick={closeUpload}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {uploadError && (
                <div
                  className="card p-3 border-l-4 border-red-400"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              <div>
                <label htmlFor="docType" className="label">
                  Tipo de documento <span className="text-red-500">*</span>
                </label>
                <select
                  id="docType"
                  value={documentTypeId}
                  onChange={(e) => {
                    setDocumentTypeId(e.target.value);
                    setReplaceConfirmed(false);
                  }}
                  className="input-field"
                >
                  <option value="">Selecciona un tipo...</option>
                  {docTypes.map((t: DocumentType) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isRequired ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aviso de reemplazo para documentos únicos ya subidos */}
              {existingDoc && isUniqueType && (
                <div
                  className={`rounded-lg p-3 border ${replaceConfirmed ? "bg-orange-50 border-orange-300" : "bg-yellow-50 border-yellow-300"}`}
                  role="alert"
                >
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    Este documento ya se encuentra subido
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    Ya existe un{" "}
                    <strong>{existingDoc.documentType.name}</strong> subido el{" "}
                    {new Date(existingDoc.uploadedAt).toLocaleDateString(
                      "es-GT",
                    )}. 
                    Si continúas, será reemplazado por el nuevo archivo.
                  </p>
                  {!replaceConfirmed ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReplaceConfirmed(true)}
                        className="text-xs font-medium bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 focus:outline-none"
                      >
                        Sí, reemplazar
                      </button>
                      <button
                        type="button"
                        onClick={closeUpload}
                        className="text-xs font-medium bg-white text-yellow-800 border border-yellow-400 px-3 py-1.5 rounded hover:bg-yellow-50 focus:outline-none"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-orange-700 font-medium">
                      ✓ Confirmado — se reemplazará al subir
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="fileInput" className="label">
                  Archivo <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs text-slate-400 font-normal">
                    PDF, JPEG, PNG, DOC, DOCX · máx 2 MB
                  </span>
                </label>
                <input
                  id="fileInput"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {fileChecking && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <svg
                      className="animate-spin w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Verificando archivo...
                  </p>
                )}
                {fileError && (
                  <p className="error-message mt-1" role="alert">
                    {fileError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="expiresAt" className="label">
                  Fecha de vencimiento
                  {requiresExpiration && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {!requiresExpiration && (
                    <span className="ml-1 text-xs text-slate-400 font-normal">
                      (opcional)
                    </span>
                  )}
                </label>
                <input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="input-field"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={closeUpload}
                disabled={uploadMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  uploadMutation.isPending ||
                  !selectedFile ||
                  !documentTypeId ||
                  !!fileError ||
                  needsReplaceConfirmation
                }
                className="btn-primary min-w-24"
              >
                {uploadMutation.isPending ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDocumentsPage;
