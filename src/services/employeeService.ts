// src/services/employeeService.ts
import { apiClient } from './api';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto, PaginatedResponse } from '../types';

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const employeeService = {
  // Obtener lista paginada
  getAll: async (filters: EmployeeFilters = {}): Promise<PaginatedResponse<Employee>> => {
    const params = new URLSearchParams();
    if (filters.search) params.set('q', filters.search);
    if (filters.department) params.set('department', filters.department);
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('_page', String(filters.page));
    if (filters.pageSize) params.set('_limit', String(filters.pageSize));

    const response = await apiClient.get<Employee[]>(`/employees?${params}`);
    const total = parseInt(response.headers['x-total-count'] || '0', 10);

    return {
      data: response.data,
      total,
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalPages: Math.ceil(total / (filters.pageSize || 10)),
    };
  },

  // Obtener uno por ID
  getById: async (id: number): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // Crear nuevo empleado
  create: async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  // Actualizar empleado (PATCH, no PUT — data es parcial y json-server
  // reemplazaría el recurso completo con un PUT, perdiendo los campos que no se envían)
  update: async (id: number, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  // Eliminar empleado
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};
