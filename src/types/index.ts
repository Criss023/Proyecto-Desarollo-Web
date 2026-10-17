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

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  maxSizeMb: number;
  allowedFormats: string[];   // ["PDF","JPEG","PNG","DOC","DOCX"]
  validityDays?: number;      // null = no expira
  isActive: boolean;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentTypeId: string;
  documentType: DocumentType;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt?: string;
  status: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON';
  uploadedBy: string;
}

export interface ExpedienteValidation {
  employeeId: string;
  totalRequired: number;
  totalPresent: number;
  totalMissing: number;
  totalExpired: number;
  totalExpiringSoon: number;
  missingDocuments: DocumentType[];
  expiredDocuments: EmployeeDocument[];
  expiringSoonDocuments: EmployeeDocument[];
}