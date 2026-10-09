import { apiClient } from './apiClient';

export interface MissingDocumentSummary {
  documentTypeId: string;
  code: string;
  name: string;
  missingCount: number;
}

export interface ComplianceReport {
  totalEmployees: number;
  completeEmployees: number;
  incompleteEmployees: number;
  inProgressEmployees: number;
  requiredDocumentTypes: number;
  compliancePercentage: string;
  missingRequiredDocuments: MissingDocumentSummary[];
  generatedAt: string;
}

export const complianceService = {
  getReport: async () => {
    const res = await apiClient.get('/api/v1/reports/document-compliance');
    return res.data.data as ComplianceReport;
  },
};