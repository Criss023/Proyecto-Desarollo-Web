import { apiClient } from './apiClient';

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface CreateDocumentTypeData {
  code: string;
  name: string;
  description?: string;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface UpdateDocumentTypeData {
  name?: string;
  description?: string;
  isRequired?: boolean;
}

export const documentTypeService = {
  list: async (filters: { page?: number; includeInactive?: boolean } = {}) => {
    const params: Record<string, string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.includeInactive !== undefined)
      params.includeInactive = String(filters.includeInactive);

    const res = await apiClient.get('/api/v1/document-types', { params });
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/api/v1/document-types/${id}`);
    return res.data.data;
  },

  create: async (data: CreateDocumentTypeData) => {
    const res = await apiClient.post('/api/v1/document-types', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateDocumentTypeData) => {
    const res = await apiClient.patch(`/api/v1/document-types/${id}`, data);
    return res.data.data;
  },

  changeStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch(`/api/v1/document-types/${id}/status`, { isActive });
    return res.data.data;
  },
};