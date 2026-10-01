// src/services/dashboardService.ts

import { authApiClient } from './authApi';
import type { ApiEnvelope, DashboardReportDto, SelfServiceProfile,
              SelfServiceDocument, PaginatedResult,
              EmployeeRecordValidationResponse } from '../types/records';

export const dashboardService = {
  getDashboard: async () => {
    const res = await authApiClient.get<ApiEnvelope<DashboardReportDto>>(
      '/api/v1/reports/dashboard'
    );
    return res.data.data;
  },
};

export const selfServiceService = {
  getProfile: async () => {
    const res = await authApiClient.get<ApiEnvelope<SelfServiceProfile>>(
      '/api/v1/self-service/profile'
    );
    return res.data.data;
  },

  updateContact: async (data: { phone?: string; address?: string }) => {
    const res = await authApiClient.patch<ApiEnvelope<SelfServiceProfile>>(
      '/api/v1/self-service/contact',
      data
    );
    return res.data.data;
  },

  listDocuments: async () => {
    const res = await authApiClient.get<ApiEnvelope<PaginatedResult<SelfServiceDocument>>>(
      '/api/v1/self-service/documents'
    );
    return res.data.data;
  },

  getDocument: async (documentId: string) => {
    const res = await authApiClient.get<ApiEnvelope<SelfServiceDocument>>(
      `/api/v1/self-service/documents/${documentId}`
    );
    return res.data.data;
  },

  downloadDocument: async (documentId: string, fallbackFileName: string) => {
    const res = await authApiClient.get(
      `/api/v1/self-service/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    const disposition: string = res.headers['content-disposition'] ?? '';
    const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
    const fileName = match?.[2] ?? fallbackFileName;

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getRecordValidation: async () => {
    const res = await authApiClient.get<ApiEnvelope<EmployeeRecordValidationResponse>>(
      '/api/v1/self-service/record-validation'
    );
    return res.data.data;
  },
};