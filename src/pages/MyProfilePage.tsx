import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { selfServiceService } from '../services/selfServiceService';
import type { UpdateContactData } from '../services/selfServiceService';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

const RECORD_STATUS_LABELS: Record<string, string> = {
  COMPLETE: 'Completo',
  INCOMPLETE: 'Incompleto',
  IN_PROGRESS: 'En progreso',
};

const RECORD_STATUS_COLORS: Record<string, string> = {
  COMPLETE: 'badge-green',
  INCOMPLETE: 'badge-red',
  IN_PROGRESS: 'badge-yellow',
};

function MyProfilePage() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UpdateContactData>({ address: '', phone: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['self-service-profile'],
    queryFn: () => selfServiceService.getProfile(),
    enabled: isAuthenticated && !!user?.accessToken,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateContactData) => selfServiceService.updateContact(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['self-service-profile'] });
      setEditMode(false);
      setSuccessMsg('Datos de contacto actualizados correctamente.');
      setFormErrors({});
      setTimeout(() => setSuccessMsg(''), 4000);
    },
  });

  function openEdit() {
    setFormData({
      address: profile?.address ?? '',
      phone: profile?.phone ?? '',
    });
    setFormErrors({});
    setEditMode(true);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (formData.phone && !/^\+?[\d\s\-()\\.]{7,20}$/.test(formData.phone)) {
      errors.phone = 'Formato de telefono invalido';
    }
    if (formData.address && formData.address.length > 255) {
      errors.address = 'La direccion no puede exceder 255 caracteres';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    updateMutation.mutate(formData);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Mi perfil</h2>
        <p className="text-sm text-slate-500 mt-0.5">Tu informacion laboral y datos de contacto</p>
      </div>

      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">No se pudo cargar tu perfil</p>
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
          <span className="text-sm text-slate-400">Cargando perfil...</span>
        </div>
      )}

      {!isLoading && !isError && profile && (
        <div className="max-w-3xl space-y-5">

          {successMsg && (
            <div className="card p-4 border-l-4 border-green-400" role="status">
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary-700">
                  {profile.firstName[0]}{profile.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {profile.firstName}{profile.middleName ? ` ${profile.middleName}` : ''} {profile.lastName}{profile.secondLastName ? ` ${profile.secondLastName}` : ''}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="badge badge-blue">{profile.position.name}</span>
                  <span className={`badge ${RECORD_STATUS_COLORS[profile.recordStatus] ?? 'badge-gray'}`}>
                    Expediente: {RECORD_STATUS_LABELS[profile.recordStatus] ?? profile.recordStatus}
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'DPI', value: profile.dpi },
                { label: 'Estado', value: STATUS_LABELS[profile.status] ?? profile.status },
                { label: 'Departamento', value: profile.department.name },
                { label: 'Sede', value: profile.department.branch.name },
                { label: 'Puesto', value: profile.position.name },
                { label: 'Fecha de ingreso', value: new Date(profile.hireDate).toLocaleDateString('es-GT') },
                { label: 'Fecha de nacimiento', value: new Date(profile.birthDate).toLocaleDateString('es-GT') },
                {
                  label: 'Fecha de baja',
                  value: profile.terminationDate
                    ? new Date(profile.terminationDate).toLocaleDateString('es-GT')
                    : 'N/A'
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-slate-400 mb-0.5">{label}</dt>
                  <dd className="font-medium text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Datos de contacto</h3>
              {!editMode && (
                <button
                  onClick={openEdit}
                  className="text-sm text-primary-600 hover:text-primary-800 hover:underline focus:outline-none"
                >
                  Editar
                </button>
              )}
            </div>

            {!editMode ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Telefono</dt>
                  <dd className="font-medium text-slate-800">{profile.phone ?? 'No registrado'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Correo electronico</dt>
                  <dd className="font-medium text-slate-800">{profile.email ?? 'No registrado'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400 mb-0.5">Direccion</dt>
                  <dd className="font-medium text-slate-800">{profile.address}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-4">
                {updateMutation.isError && (
                  <div className="card p-3 border-l-4 border-red-400" role="alert">
                    <p className="text-sm text-red-700">Error al actualizar. Intenta nuevamente.</p>
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="label">
                    Telefono <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone ?? ''}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+502 1234-5678"
                    className={`input-field ${formErrors.phone ? 'border-red-400' : ''}`}
                    aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                  />
                  {formErrors.phone && (
                    <p id="phone-error" className="error-message" role="alert">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="label">
                    Direccion <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="address"
                    value={formData.address ?? ''}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="Zona 10, Ciudad de Guatemala..."
                    rows={2}
                    className={`input-field ${formErrors.address ? 'border-red-400' : ''}`}
                    aria-describedby={formErrors.address ? 'address-error' : undefined}
                  />
                  {formErrors.address && (
                    <p id="address-error" className="error-message" role="alert">{formErrors.address}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setEditMode(false)}
                    disabled={updateMutation.isPending}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="btn-primary min-w-24"
                  >
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default MyProfilePage;