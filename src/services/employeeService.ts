import { apiClient } from './apiClient';
import type { ApiEnvelope, PaginatedResult } from '../types';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: { id: string; name: string };
  department: { id: string; name: string };
  branch: { id: string; name: string };
  status: string;
  hireDate: string;
}

export interface EmployeeCatalog {
  departments: { id: string; name: string }[];
  positions: { id: string; code: string; name: string; departmentIds: string[] }[];
  branches: { id: string; name: string }[];
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}


export const employeeService = {
  list: async (filters: EmployeeFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.search)       params.search       = filters.search;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.status)       params.status       = filters.status;
    if (filters.page)         params.page         = String(filters.page);
    if (filters.limit)        params.limit        = String(filters.limit);
    if (filters.sortBy)       params.sortBy       = filters.sortBy;
    if (filters.sortOrder)    params.sortOrder    = filters.sortOrder;

    const res = await apiClient.get<ApiEnvelope<PaginatedResult<Employee>>>(
      '/api/v1/employees',
      { params }
    );
    return res.data.data;
  },

  listUsers: async () => {
  const res = await apiClient.get<ApiEnvelope<PaginatedResult<User>>>(
    '/api/v1/users',
    { params: { limit: 100 } }
  );
  return res.data.data.items;
},

  getById: async (id: string) => {
    const res = await apiClient.get<ApiEnvelope<Employee>>(
      `/api/v1/employees/${id}`
    );
    return res.data.data;
  },

  getCatalogs: async () => {
    const res = await apiClient.get<ApiEnvelope<EmployeeCatalog>>(
      '/api/v1/employee-catalogs'
    );
    return res.data.data;
  },

  create: async (data: {
  dpi: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate: string;
  address?: string;
  phone?: string;
  email: string;
  baseSalary: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  userId?: string;
}) => {
  const res = await apiClient.post<ApiEnvelope<Employee>>(
    '/api/v1/employees',
    data
  );
  return res.data.data;
},

changeStatus: async (id: string, status: string, reason?: string) => {
  const res = await apiClient.patch<ApiEnvelope<Employee>>(
    `/api/v1/employees/${id}/status`,
    { status, reason }
  );
  return res.data.data;
},
};