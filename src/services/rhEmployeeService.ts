// src/services/rhEmployeeService.ts

import { authApiClient } from './authApi';
import type { ApiEnvelope, PaginatedResult, EmployeeResponse, EmployeeCatalogsResponse } from '../types/records';

export interface RHEmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const rhEmployeeService = {
  list: async (filters: RHEmployeeFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.search)       params.search       = filters.search;
    if (filters.departmentId) params.departmentId = filters.departmentId;
    if (filters.status)       params.status       = filters.status;
    if (filters.page)         params.page         = String(filters.page);
    if (filters.limit)        params.limit        = String(filters.limit);
    if (filters.sortBy)       params.sortBy       = filters.sortBy;
    if (filters.sortOrder)    params.sortOrder    = filters.sortOrder;

    const res = await authApiClient.get<ApiEnvelope<PaginatedResult<EmployeeResponse>>>(
      '/api/v1/employees',
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await authApiClient.get<ApiEnvelope<EmployeeResponse>>(
      `/api/v1/employees/${id}`
    );
    return res.data.data;
  },

  getCatalogs: async () => {
    const res = await authApiClient.get<ApiEnvelope<EmployeeCatalogsResponse>>(
      '/api/v1/employee-catalogs'
    );
    return res.data.data;
  },
};