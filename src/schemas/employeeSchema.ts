// src/schemas/employeeSchema.ts
import { z } from 'zod';

export const employeeSchema = z.object({
  name: z
    .string({ error: 'El nombre es requerido' })
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  email: z
    .string({ error: 'El email es requerido' })
    .email('Formato de email inválido'),

  position: z
    .string({ error: 'El cargo es requerido' })
    .min(2, 'Mínimo 2 caracteres'),

  department: z.enum(
    ['Tecnología', 'Recursos Humanos', 'Finanzas', 'Operaciones', 'Ventas'],
    { error: 'Selecciona un departamento' }
  ),

  salary: z.coerce
    .number({ error: 'El salario es requerido' })
    .min(1, 'El salario debe ser mayor a 0')
    .max(999999, 'Salario fuera de rango'),

  hireDate: z
    .string({ error: 'La fecha de ingreso es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)'),

  role: z.enum(['admin', 'hr', 'employee']).default('employee'),

  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),

  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal('')),

  avatarUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

// Tipo de ENTRADA del schema (antes de que Zod corra z.coerce y los .default()) —
// react-hook-form necesita este tipo para el formulario en sí, distinto del tipo
// de SALIDA (EmployeeFormData) que recibe onSubmit una vez que el resolver ya validó.
export type EmployeeFormInput = z.input<typeof employeeSchema>;
