// src/services/alertService.ts

import { authApiClient } from './authApi';
import type { ApiEnvelope, PaginatedResult, EmployeeDocumentAlertResponse,
              DocumentAlertSyncResponse, DocumentComplianceReport } from '../types/records';

export interface AlertFilters {
  page?: number;
  limit?: number;
  severity?: 'HIGH' | 'CRITICAL' | 'WARNING';
  alertType?: string;
  resolved?: boolean;
}

export const alertService = {
  list: async (filters: AlertFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.page)      params.page      = String(filters.page);
    if (filters.limit)     params.limit     = String(filters.limit);
    if (filters.severity)  params.severity  = filters.severity;
    if (filters.alertType) params.alertType = filters.alertType;
    if (filters.resolved !== undefined) params.resolved = String(filters.resolved);

    const res = await authApiClient.get<ApiEnvelope<PaginatedResult<EmployeeDocumentAlertResponse>>>(
      '/api/v1/employee-record-alerts',
      { params }
    );
    return res.data.data;
  },

  // Solo ADMIN
  sync: async () => {
    const res = await authApiClient.post<ApiEnvelope<DocumentAlertSyncResponse>>(
      '/api/v1/employee-record-alerts/sync'
    );
    return res.data.data;
  },

  getComplianceReport: async () => {
    const res = await authApiClient.get<ApiEnvelope<DocumentComplianceReport>>(
      '/api/v1/reports/document-compliance'
    );
    return res.data.data;
  },
};