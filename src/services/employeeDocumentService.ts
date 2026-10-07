import { apiClient } from './apiClient';

export interface EmployeeDocument {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  documentType: {
    id: string;
    name: string;
    requiresExpiration: boolean;
  };
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt?: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface RecordValidation {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  isComplete: boolean;
  requiredDocuments: {
    documentTypeId: string;
    documentTypeName: string;
    isPresent: boolean;
    isExpired: boolean;
    expiresAt?: string;
  }[];
  lastValidatedAt: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function validateFileClient(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES)
    return `El archivo excede 2 MB (tiene ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  if (!ALLOWED_MIME_TYPES.includes(file.type))
    return 'Tipo no permitido. Use PDF, JPEG, PNG, DOC o DOCX.';
  return null;
}

export const employeeDocumentService = {
  list: async (employeeId: string) => {
    const res = await apiClient.get(`/api/v1/employees/${employeeId}/documents`);
    return res.data.data;
  },

  upload: async (
    employeeId: string,
    file: File,
    documentTypeId: string,
    expiresAt?: string
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentTypeId', documentTypeId);
    if (expiresAt) form.append('expiresAt', expiresAt);

    const res = await apiClient.post(
      `/api/v1/employees/${employeeId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  delete: async (documentId: string) => {
    await apiClient.delete(`/api/v1/employee-documents/${documentId}`);
  },

  download: async (documentId: string, fallbackFileName: string) => {
    const res = await apiClient.get(
      `/api/v1/employee-documents/${documentId}/download`,
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

  getValidation: async (employeeId: string) => {
    const res = await apiClient.get(
      `/api/v1/employees/${employeeId}/record-validation`
    );
    return res.data.data;
  },

  syncValidation: async (employeeId: string) => {
    const res = await apiClient.post(
      `/api/v1/employees/${employeeId}/record-validation/sync`
    );
    return res.data.data;
  },
};