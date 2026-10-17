import { apiClient } from './apiClient';
import type { ApiEnvelope, PaginatedResult, DocumentType, EmployeeDocument, ExpedienteValidation } from '../types';

export const documentTypeService = {
  list: async () => {
    const res = await apiClient.get<ApiEnvelope<PaginatedResult<DocumentType>>>(
      '/api/v1/document-types',
      { params: { limit: 100 } }
    );
    return res.data.data.items;
  },

  create: async (payload: Omit<DocumentType, 'id'>) => {
    const res = await apiClient.post<ApiEnvelope<DocumentType>>(
      '/api/v1/document-types',
      payload
    );
    return res.data.data;
  },

  update: async (id: string, payload: Partial<Omit<DocumentType, 'id'>>) => {
    const res = await apiClient.patch<ApiEnvelope<DocumentType>>(
      `/api/v1/document-types/${id}`,
      payload
    );
    return res.data.data;
  },

  toggleActive: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<ApiEnvelope<DocumentType>>(
      `/api/v1/document-types/${id}`,
      { isActive }
    );
    return res.data.data;
  },
};

export const expedienteService = {
  listByEmployee: async (employeeId: string) => {
    const res = await apiClient.get<ApiEnvelope<EmployeeDocument[]>>(
      `/api/v1/employee-records/${employeeId}`
    );
    return res.data.data;
  },

  upload: async (employeeId: string, documentTypeId: string, file: File, expiresAt?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentTypeId', documentTypeId);
    if (expiresAt) form.append('expiresAt', expiresAt);

    const res = await apiClient.post<ApiEnvelope<EmployeeDocument>>(
      `/api/v1/employee-records/${employeeId}/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  download: async (employeeId: string, documentId: string, fileName: string) => {
    const res = await apiClient.get(
      `/api/v1/employee-records/${employeeId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },

  delete: async (employeeId: string, documentId: string) => {
    await apiClient.delete(
      `/api/v1/employee-records/${employeeId}/documents/${documentId}`
    );
  },

  validate: async (employeeId: string) => {
    const res = await apiClient.get<ApiEnvelope<ExpedienteValidation>>(
      `/api/v1/employee-records/${employeeId}/validation`
    );
    return res.data.data;
  },
};