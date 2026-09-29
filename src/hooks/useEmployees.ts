// src/hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, type EmployeeFilters } from '../services/employeeService';
import type { CreateEmployeeDto, UpdateEmployeeDto } from '../types';

// Query key factory — centraliza los nombres de las queries
export const employeeKeys = {
  all: ['employees'] as const,
  list: (filters: EmployeeFilters) => ['employees', 'list', filters] as const,
  detail: (id: number) => ['employees', id] as const,
};

// Hook para obtener la lista de empleados
export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeeService.getAll(filters),
  });
}

// Hook para obtener un empleado por ID
export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () => employeeService.getById(id!),
    enabled: !!id, // Solo ejecuta si hay un ID
  });
}

// Hook para crear empleado
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => employeeService.create(data),
    onSuccess: () => {
      // Invalida la lista para que se refetche
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

// Hook para actualizar empleado
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeDto }) =>
      employeeService.update(id, data),
    onSuccess: (updatedEmployee) => {
      // Actualiza el cache directamente (sin re-fetch)
      queryClient.setQueryData(
        employeeKeys.detail(updatedEmployee.id),
        updatedEmployee
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

// Hook para eliminar empleado
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
