// src/types/records.ts

// -- Catálogos --------------------------------

export interface EmployeeCatalogOption {
  id: string;
  name: string;
}

export interface EmployeePositionCatalogOption {
  id: string;
  name: string;
  departmentId: string;
}

export interface EmployeeCatalogsResponse {
  departments: EmployeeCatalogOption[];
  positions: EmployeePositionCatalogOption[];
  branches: EmployeeCatalogOption[];
  statuses: EmployeeCatalogOption[];
}

// -- Empleados --------------------------------

export interface EmployeeResponse {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: { id: string; name: string };
  department: { id: string; name: string };
  branch: { id: string; name: string };
  status: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

// -- Tipos documentales ----------------------------

export interface DocumentTypeResponse {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  requiresExpiration: boolean;
  allowedMimeTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTypeDto {
  name: string;
  description?: string;
  isRequired: boolean;
  requiresExpiration: boolean;
  allowedMimeTypes: string[];
}

export interface UpdateDocumentTypeDto {
  name?: string;
  description?: string;
  isRequired?: boolean;
  requiresExpiration?: boolean;
  allowedMimeTypes?: string[];
}

// -- Documentos de empleado --------------------------

export interface EmployeeDocumentResponse {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  documentType: DocumentTypeResponse;
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

// -- Validación de expediente -------------------------

export interface RequiredDocumentValidation {
  documentTypeId: string;
  documentTypeName: string;
  isPresent: boolean;
  isExpired: boolean;
  expiresAt?: string;
}

export interface EmployeeRecordValidationResponse {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  isComplete: boolean;
  requiredDocuments: RequiredDocumentValidation[];
  lastValidatedAt: string;
}

// -- Alertas documentales ---------------------------

export type AlertSeverity = 'HIGH' | 'CRITICAL' | 'WARNING';
export type AlertType =
  | 'MISSING_REQUIRED_DOCUMENT'
  | 'EXPIRED_DOCUMENT'
  | 'DOCUMENT_EXPIRING';

export interface EmployeeDocumentAlertResponse {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  organization: {
    documentTypeId: string;
    documentTypeName: string;
  };
  alertType: AlertType;
  severity: AlertSeverity;
  documentExpiresAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface DocumentAlertSyncResponse {
  synced: number;
  resolved: number;
}

// -- Reporte de cumplimiento -------------------------

export interface MissingDocumentSummary {
  documentTypeId: string;
  documentTypeName: string;
  missingCount: number;
}

export interface DocumentComplianceReport {
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  complianceRate: number;
  missingDocumentsSummary: MissingDocumentSummary[];
}

// -- Dashboard --------------------------------

export interface DashboardReportDto {
  workforce: {
    total: number;
    active: number;
    onLeave: number;
    inactive: number;
  };
  records: {
    complete: number;
    incomplete: number;
    completionRate: number;
  };
  leaveRequests: {
    pending: number;
    approvedThisMonth: number;
  };
  documents: {
    withAlerts: number;
    expiringThisMonth: number;
  };
}

// -- Self-service -------------------------------

export interface SelfServiceProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: { id: string; name: string };
  department: { id: string; name: string };
  branch: { id: string; name: string };
  status: string;
  hireDate: string;
}

export interface SelfServiceDocument {
  id: string;
  documentType: { id: string; name: string };
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt?: string;
  uploadedAt: string;
}

// -- Paginación --------------------------------

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

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}