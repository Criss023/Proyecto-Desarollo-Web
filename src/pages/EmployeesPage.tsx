// src/pages/EmployeesPage.tsx
import { useState, useCallback, useMemo } from 'react';
import type { Employee, Department, EmployeeStatus } from '../types';
import EmployeeCard from '../components/EmployeeCard';
import StatsBadge from '../components/StatsBadge';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import EmployeeForm from '../components/EmployeeForm';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import type { EmployeeFormData } from '../schemas/employeeSchema';
import { useHasRole } from '../components/RoleGuard';

const formFieldClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Ciclo de estados al hacer clic en la insignia de una tarjeta
const nextStatus: Record<EmployeeStatus, EmployeeStatus> = {
  active: 'on_leave',
  on_leave: 'inactive',
  inactive: 'active',
};

function EmployeesPage() {
  // Esta página ya está restringida por RoleGuard a ADMIN/HR_MANAGER (App.tsx).
  // Pero eliminar empleados, en la API real, es exclusivo de ADMIN — ni HR_MANAGER
  // puede. Es una tercera capa de restricción: acción deshabilitada según rol,
  // no ruta bloqueada ni sección de UI oculta.
  const canDeleteEmployees = useHasRole(['ADMIN']);

  // Estado de los filtros — esto sigue siendo estado LOCAL (de la UI), no del servidor
  const [search, setSearch] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | ''>('');

  // Estado del SERVIDOR: la lista de empleados, filtrada. TanStack Query se encarga
  // de pedirla, cachearla y mantenerla sincronizada — no hay useEffect ni useState local.
  const { data, isLoading: loading, isError, error: queryError } = useEmployees({
    search: search || undefined,
    department: selectedDepartment || undefined,
    status: selectedStatus || undefined,
  });
  const employees = data?.data || [];

  // Segunda query, sin filtros — las estadísticas son sobre el TOTAL de empleados,
  // no sobre el filtro activo, así que necesitan su propia lista completa cacheada aparte.
  const { data: allData } = useEmployees({});
  const allEmployees = useMemo(() => allData?.data ?? [], [allData]);
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter(emp => emp.status === 'active').length;
  const onLeaveEmployees = allEmployees.filter(emp => emp.status === 'on_leave').length;
  const inactiveEmployees = allEmployees.filter(emp => emp.status === 'inactive').length;

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Estado del modal de creación/edición — reemplaza al formulario en línea de la Clase 7
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Memoizamos el handler para no recrearlo en cada render
  const handleSelectEmployee = useCallback((employee: Employee) => {
    alert(`Empleado: ${employee.name}\nCargo: ${employee.position}\nDepartamento: ${employee.department}`);
  }, []);

  const handleDeleteEmployee = useCallback((id: number) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    deleteEmployee.mutate(id);
  }, [deleteEmployee]);

  // Actualiza el estado de un empleado (ciclo Activo → En permiso → Inactivo → Activo)
  const handleToggleStatus = useCallback((employee: Employee) => {
    updateEmployee.mutate({ id: employee.id, data: { status: nextStatus[employee.status] } });
  }, [updateEmployee]);

  const handleOpenCreate = useCallback(() => {
    setEditingEmployee(undefined);
    setSubmitError(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setSubmitError(null);
    setModalOpen(true);
  }, []);

  // React Hook Form ya validó los datos con Zod antes de llegar acá —
  // esta función solo decide crear vs. actualizar y llama a la mutación correcta.
  const handleSubmit = useCallback(async (formData: EmployeeFormData) => {
    setSubmitError(null);
    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({ id: editingEmployee.id, data: formData });
      } else {
        await createEmployee.mutateAsync(formData);
      }
      setModalOpen(false);
    } catch {
      setSubmitError('No se pudo guardar el empleado. Intenta de nuevo.');
    }
  }, [editingEmployee, createEmployee, updateEmployee]);

  const departments: Department[] = ['Tecnología', 'Recursos Humanos', 'Finanzas', 'Operaciones', 'Ventas'];
  const statuses: EmployeeStatus[] = ['active', 'inactive', 'on_leave'];
  const statusLabels: Record<EmployeeStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    on_leave: 'En permiso',
  };

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Empleados</h2>
          <p className="text-slate-500 mt-1">
            {loading ? 'Cargando...' : `${employees.length} de ${totalEmployees} empleados`}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-brand-800 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo empleado
        </button>
      </div>

      {/* Estadísticas */}
      <div className="flex flex-wrap gap-4 mb-6">
        <StatsBadge label="Total de empleados" value={totalEmployees} variant="blue" />
        <StatsBadge label="Empleados activos" value={activeEmployees} variant="green" />
        <StatsBadge label="Empleados en permiso" value={onLeaveEmployees} variant="yellow" />
        <StatsBadge label="Empleados inactivos" value={inactiveEmployees} variant="red" />
      </div>

      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-end gap-3">
        {/* Búsqueda por texto */}
        <FormField label="Buscar" className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Buscar por nombre, email o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={formFieldClass}
          />
        </FormField>

        {/* Filtro por departamento */}
        <FormField label="Departamento" className="min-w-[180px]">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value as Department | '')}
            className={formFieldClass}
          >
            <option value="">Todos los departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </FormField>

        {/* Filtro por estado */}
        <FormField label="Estado" className="min-w-[160px]">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as EmployeeStatus | '')}
            className={formFieldClass}
          >
            <option value="">Todos los estados</option>
            {statuses.map(status => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </FormField>

        {/* Botón limpiar filtros */}
        {(search || selectedDepartment || selectedStatus) && (
          <button
            onClick={() => { setSearch(''); setSelectedDepartment(''); setSelectedStatus(''); }}
            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mr-3" />
          <span>Cargando empleados...</span>
        </div>
      )}

      {/* Estado de error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Error al cargar los empleados</p>
          <p className="text-red-500 text-sm mt-1">
            {(queryError as Error)?.message || 'Error desconocido'}
          </p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !isError && employees.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>No se encontraron empleados con los filtros aplicados.</p>
        </div>
      )}

      {/* Lista de empleados */}
      {!loading && !isError && employees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map(employee => (
            <div key={employee.id} className="relative">
              <div className="absolute -top-2.5 -right-2.5 z-10 flex gap-1">
                <button
                  onClick={() => handleOpenEdit(employee)}
                  aria-label="Editar empleado"
                  title="Editar empleado"
                  className="w-6 h-6 rounded-full border-2 border-white bg-brand-600 text-white cursor-pointer text-xs leading-5 shadow-md"
                >
                  ✎
                </button>
                {canDeleteEmployees && (
                  <button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    aria-label="Eliminar empleado"
                    title="Eliminar empleado"
                    className="w-6 h-6 rounded-full border-2 border-white bg-red-500 text-white cursor-pointer text-sm leading-5 shadow-md"
                  >
                    ×
                  </button>
                )}
              </div>
              <EmployeeCard
                employee={employee}
                onSelect={handleSelectEmployee}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición — React Hook Form + Zod */}
      <Modal
        isOpen={modalOpen}
        title={editingEmployee ? `Editar: ${editingEmployee.name}` : 'Nuevo empleado'}
        onClose={() => setModalOpen(false)}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          isLoading={createEmployee.isPending || updateEmployee.isPending}
          error={submitError}
        />
      </Modal>
    </div>
  );
}

export default EmployeesPage;
