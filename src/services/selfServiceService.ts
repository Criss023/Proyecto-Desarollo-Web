import { apiClient } from './apiClient';

export interface SelfServiceBranch {
  id: string;
  code: string;
  name: string;
}

export interface SelfServiceDepartment {
  id: string;
  code: string;
  name: string;
  branch: SelfServiceBranch;
}

export interface SelfServiceCatalog {
  id: string;
  code: string;
  name: string;
}

export interface SelfServiceProfile {
  employeeId: string;
  userId: string;
  dpi: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate: string;
  address: string;
  phone?: string;
  email?: string;
  baseSalary: number;
  hireDate: string;
  terminationDate?: string;
  status: string;
  recordStatus: string;
  department: SelfServiceDepartment;
  position: SelfServiceCatalog;
  updatedAt: string;
}

export interface UpdateContactData {
  address?: string;
  phone?: string;
}

export interface SelfServiceDocument {
  id: string;
  documentType: {
    id: string;
    code: string;
    name: string;
    description?: string;
    isRequired: boolean;
    isActive: boolean;
  };
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  expiresAt?: string;
}

export const selfServiceService = {
  getProfile: async () => {
    const res = await apiClient.get('/api/v1/self-service/profile');
    return res.data.data as SelfServiceProfile;
  },

  updateContact: async (data: UpdateContactData) => {
    const res = await apiClient.patch('/api/v1/self-service/contact', data);
    return res.data.data as SelfServiceProfile;
  },

  listDocuments: async () => {
    const res = await apiClient.get('/api/v1/self-service/documents');
    return res.data.data;
  },

  getDocument: async (id: string) => {
    const res = await apiClient.get(`/api/v1/self-service/documents/${id}`);
    return res.data.data;
  },

  downloadDocument: async (id: string, fallbackFileName: string) => {
    const res = await apiClient.get(
      `/api/v1/self-service/documents/${id}/download`,
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
};