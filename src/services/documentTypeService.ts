// src/services/documentTypeService.ts

import { authApiClient } from './authApi';
import type { ApiEnvelope, PaginatedResult, DocumentTypeResponse,
              CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../types/records';

export interface DocumentTypeFilters {
  search?: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export const documentTypeService = {
  list: async (filters: DocumentTypeFilters = {}) => {
    const params: Record<string, string> = {};
    if (filters.search)   params.search  = filters.search;
    if (filters.page)     params.page    = String(filters.page);
    if (filters.limit)    params.limit   = String(filters.limit);
    if (filters.includeInactive !== undefined)
      params.includeInactive = String(filters.includeInactive);

    const res = await authApiClient.get<ApiEnvelope<PaginatedResult<DocumentTypeResponse>>>(
      '/api/v1/document-types',
      { params }
    );
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await authApiClient.get<ApiEnvelope<DocumentTypeResponse>>(
      `/api/v1/document-types/${id}`
    );
    return res.data.data;
  },

  create: async (data: CreateDocumentTypeDto) => {
    const res = await authApiClient.post<ApiEnvelope<DocumentTypeResponse>>(
      '/api/v1/document-types',
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: UpdateDocumentTypeDto) => {
    const res = await authApiClient.patch<ApiEnvelope<DocumentTypeResponse>>(
      `/api/v1/document-types/${id}`,
      data
    );
    return res.data.data;
  },

  changeStatus: async (id: string, isActive: boolean) => {
    const res = await authApiClient.patch<ApiEnvelope<DocumentTypeResponse>>(
      `/api/v1/document-types/${id}/status`,
      { isActive }
    );
    return res.data.data;
  },
};