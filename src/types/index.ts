export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRole {
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}