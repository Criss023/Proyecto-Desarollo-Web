import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { documentTypeService } from '../services/documentTypeService';
import type { DocumentType, CreateDocumentTypeData, UpdateDocumentTypeData } from '../services/documentTypeService';
import { useHasRole } from '../components/RoleGuard';

function DocumentTypesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = useHasRole(['ADMIN']);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [confirmStatusId, setConfirmStatusId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDocumentTypeData>({
    code: '',
    name: '',
    description: '',
    isRequired: false,
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const queryEnabled = isAuthenticated && !!user?.accessToken;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['document-types', includeInactive],
    queryFn: () => documentTypeService.list({ includeInactive: isAdmin ? includeInactive : undefined }),
    enabled: queryEnabled,
  });

  const items: DocumentType[] = data?.items ?? data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentTypeData) => documentTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      queryClient.invalidateQueries({ queryKey: ['document-types-all'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTypeData }) =>
      documentTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      queryClient.invalidateQueries({ queryKey: ['document-types-all'] });
      closeModal();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      documentTypeService.changeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      setConfirmStatusId(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setFormData({ code: '', name: '', description: '', isRequired: false, isActive: true });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(dt: DocumentType) {
    setEditing(dt);
    setFormData({ code: dt.code, name: dt.name, description: dt.description ?? '', isRequired: dt.isRequired, isActive: dt.isActive });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setFormErrors({});
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.code.trim()) errors.code = 'El codigo es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: { name: formData.name, description: formData.description, isRequired: formData.isRequired }
      });
    } else {
      createMutation.mutate(formData);
    }
  }

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'badge-red',
    HIGH: 'badge-yellow',
    WARNING: 'badge-blue',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tipos de documento</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Cargando...' : `${items.length} tipos encontrados`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={e => setIncludeInactive(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-400"
              />
              Incluir inactivos
            </label>
          )}
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary text-sm py-1.5 px-3">
              Nuevo tipo
            </button>
          )}
        </div>
      </div>

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">No se pudieron cargar los tipos de documento</p>
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5 px-3">Reintentar</button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20" aria-busy="true">
          <svg className="animate-spin w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm text-slate-400">Cargando...</span>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-12 text-center" role="status">
          <p className="text-slate-400 text-sm">No hay tipos de documento registrados.</p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Codigo</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Nombre</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600 hidden sm:table-cell">Requerido</th>
                  <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Estado</th>
                  {isAdmin && <th scope="col" className="text-left px-5 py-3 font-medium text-slate-600">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((dt: DocumentType) => (
                  <tr key={dt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {dt.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{dt.name}</div>
                      {dt.description && (
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{dt.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`badge ${dt.isRequired ? 'badge-red' : 'badge-gray'}`}>
                        {dt.isRequired ? 'Requerido' : 'Opcional'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${dt.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {dt.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(dt)}
                            className="text-primary-600 hover:text-primary-800 hover:underline text-sm focus:outline-none"
                            aria-label={`Editar ${dt.name}`}
                          >
                            Editar
                          </button>
                          {confirmStatusId === dt.id ? (
                            <span className="flex items-center gap-1 text-xs">
                              <span className="text-slate-600 font-medium">Confirmar?</span>
                              <button
                                onClick={() => statusMutation.mutate({ id: dt.id, isActive: !dt.isActive })}
                                className="text-red-600 font-bold hover:underline focus:outline-none"
                              >
                                Si
                              </button>
                              <button
                                onClick={() => setConfirmStatusId(null)}
                                className="text-slate-500 hover:underline focus:outline-none"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmStatusId(dt.id)}
                              className={`text-sm hover:underline focus:outline-none ${dt.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                              aria-label={`${dt.isActive ? 'Desactivar' : 'Activar'} ${dt.name}`}
                            >
                              {dt.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? 'Editar tipo de documento' : 'Nuevo tipo de documento'}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editing ? 'Editar tipo de documento' : 'Nuevo tipo de documento'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(createMutation.isError || updateMutation.isError) && (
                <div className="card p-3 border-l-4 border-red-400" role="alert">
                  <p className="text-sm text-red-700">Error al guardar. Intenta nuevamente.</p>
                </div>
              )}

              <div>
                <label htmlFor="code" className="label">
                  Codigo <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                  disabled={!!editing}
                  placeholder="Ej: CONTRATO_LABORAL"
                  className={`input-field ${formErrors.code ? 'border-red-400' : ''} ${editing ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                  aria-required="true"
                />
                {formErrors.code && <p className="error-message" role="alert">{formErrors.code}</p>}
                {editing && <p className="text-xs text-slate-400 mt-1">El codigo no se puede modificar</p>}
              </div>

              <div>
                <label htmlFor="docName" className="label">
                  Nombre <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="docName"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Contrato Laboral"
                  className={`input-field ${formErrors.name ? 'border-red-400' : ''}`}
                  aria-required="true"
                />
                {formErrors.name && <p className="error-message" role="alert">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Descripcion <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descripcion del tipo de documento..."
                  rows={2}
                  className="input-field"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={e => setFormData(p => ({ ...p, isRequired: e.target.checked }))}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-400"
                />
                <span className="text-sm text-slate-700">Documento requerido</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={closeModal}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary min-w-24"
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear tipo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentTypesPage;