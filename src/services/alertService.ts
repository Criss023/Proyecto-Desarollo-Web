import { apiClient } from './apiClient';

export interface DocumentAlertEmployee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface DocumentAlertOrganization {
  branchId: string;
  branchCode: string;
  branchName: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
}

export interface DocumentAlert {
  alertType: string;
  severity: string;
  employee: DocumentAlertEmployee;
  organization: DocumentAlertOrganization;
  documentType: {
    id: string;
    code: string;
    name: string;
    isRequired: boolean;
    isActive: boolean;
  };
  documentId?: string;
  originalName?: string;
  expiresAt?: string;
  daysUntilExpiration?: number;
}

export interface AlertSyncResponse {
  processedEmployees: number;
  updatedEmployees: number;
  synchronizedAt: string;
}

export const alertService = {
  list: async (filters: { page?: number; severity?: string; alertType?: string } = {}) => {
    const params: Record<string, string> = {};
    if (filters.page)      params.page      = String(filters.page);
    if (filters.severity)  params.severity  = filters.severity;
    if (filters.alertType) params.alertType = filters.alertType;

    const res = await apiClient.get('/api/v1/employee-record-alerts', { params });
    return res.data.data;
  },

  sync: async () => {
    const res = await apiClient.post('/api/v1/employee-record-alerts/sync');
    return res.data.data as AlertSyncResponse;
  },
};