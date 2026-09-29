// src/components/EmployeeForm.tsx
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema, type EmployeeFormData, type EmployeeFormInput } from '../schemas/employeeSchema';
import type { Employee } from '../types';

interface EmployeeFormProps {
  employee?: Employee;          // Si viene, es modo edición
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;        // Error de la mutación (crear/actualizar falló), no de validación
}

// Componente reutilizable para un campo del formulario
function FormField({
  label,
  error,
  children,
  required = false,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) => `
  w-full px-3 py-2 border rounded-lg text-sm transition-colors
  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
  ${hasError
    ? 'border-red-400 bg-red-50 focus:ring-red-400'
    : 'border-slate-300 bg-white'
  }
`;

function EmployeeForm({ employee, onSubmit, onCancel, isLoading = false, error }: EmployeeFormProps) {
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormInput, unknown, EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      department: 'Tecnología',
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      role: 'employee',
      status: 'active',
      phone: '',
      avatarUrl: '',
    },
  });

  // Si viene un empleado (modo edición), poblar el formulario
  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        hireDate: employee.hireDate,
        role: employee.role,
        status: employee.status,
        phone: employee.phone || '',
        avatarUrl: employee.avatarUrl || '',
      });
    }
  }, [employee, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Fila 1: Nombre y Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nombre completo" error={errors.name?.message} required>
          <input
            {...register('name')}
            type="text"
            placeholder="Ana García"
            className={inputClass(!!errors.name)}
            aria-required="true"
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </FormField>

        <FormField label="Correo electrónico" error={errors.email?.message} required>
          <input
            {...register('email')}
            type="email"
            placeholder="ana@empresa.com"
            className={inputClass(!!errors.email)}
            aria-required="true"
          />
        </FormField>
      </div>

      {/* Fila 2: Cargo y Departamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Cargo" error={errors.position?.message} required>
          <input
            {...register('position')}
            type="text"
            placeholder="Desarrolladora Frontend"
            className={inputClass(!!errors.position)}
            aria-required="true"
          />
        </FormField>

        <FormField label="Departamento" error={errors.department?.message} required>
          <select
            {...register('department')}
            className={inputClass(!!errors.department)}
            aria-required="true"
          >
            <option value="">Selecciona...</option>
            {['Tecnología', 'Recursos Humanos', 'Finanzas', 'Operaciones', 'Ventas'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Fila 3: Salario y Fecha de ingreso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Salario (GTQ)" error={errors.salary?.message} required>
          <input
            {...register('salary')}
            type="number"
            min="0"
            step="100"
            placeholder="8500"
            className={inputClass(!!errors.salary)}
            aria-required="true"
          />
        </FormField>

        <FormField label="Fecha de ingreso" error={errors.hireDate?.message} required>
          <input
            {...register('hireDate')}
            type="date"
            className={inputClass(!!errors.hireDate)}
            aria-required="true"
          />
        </FormField>
      </div>

      {/* Fila 4: Rol y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Rol del sistema" error={errors.role?.message}>
          <select {...register('role')} className={inputClass(!!errors.role)}>
            <option value="employee">Empleado</option>
            <option value="hr">RRHH</option>
            <option value="admin">Administrador</option>
          </select>
        </FormField>

        <FormField label="Estado" error={errors.status?.message}>
          <select {...register('status')} className={inputClass(!!errors.status)}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="on_leave">En permiso</option>
          </select>
        </FormField>
      </div>

      {/* Fila 5: Teléfono y Avatar (opcionales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Teléfono (opcional)" error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+502 1234-5678"
            className={inputClass(!!errors.phone)}
          />
        </FormField>

        <FormField label="URL de avatar (opcional)" error={errors.avatarUrl?.message}>
          <input
            {...register('avatarUrl')}
            type="url"
            placeholder="https://..."
            className={inputClass(!!errors.avatarUrl)}
          />
        </FormField>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || (!isDirty && isEditing)}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-800 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 min-w-24"
        >
          {isLoading
            ? 'Guardando...'
            : isEditing ? 'Guardar cambios' : 'Crear empleado'
          }
        </button>
      </div>
    </form>
  );
}

export default EmployeeForm;
