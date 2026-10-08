import { apiClient } from './apiClient';

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  requiresExpiration: boolean;
  allowedMimeTypes: string[];
  isActive: boolean;
}

export interface DocumentTypeFilters {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export const documentTypeService = {
  list: async (filters: DocumentTypeFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);
    if (filters.includeInactive !== undefined)
      params.includeInactive = String(filters.includeInactive);

    const res = await apiClient.get('/api/v1/document-types', { params });
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/api/v1/document-types/${id}`);
    return res.data.data;
  },

  create: async (data: Omit<DocumentType, 'id' | 'isActive'>) => {
    const res = await apiClient.post('/api/v1/document-types', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Omit<DocumentType, 'id' | 'isActive'>>) => {
    const res = await apiClient.patch(`/api/v1/document-types/${id}`, data);
    return res.data.data;
  },

  changeStatus: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch(`/api/v1/document-types/${id}/status`, { isActive });
    return res.data.data;
  },
};