// src/types/index.ts

// --- Tipos base del dominio ---

export type Department =
  | "Tecnología"
  | "Recursos Humanos"
  | "Finanzas"
  | "Operaciones"
  | "Ventas";

export type EmployeeRole = "admin" | "hr" | "employee";

export type EmployeeStatus = "active" | "inactive" | "on_leave";

// --- Entidad principal ---

export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: Department;
  salary: number;
  hireDate: string; // ISO 8601: "2024-01-15"
  status: EmployeeStatus;
  role: EmployeeRole;
  avatarUrl?: string;
  phone?: string;
}

// --- Tipos para creación y actualización ---

export type CreateEmployeeDto = Omit<Employee, "id">;
export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

// --- Tipos de autenticación (JWT real contra API-RH, Clase 9) ---

// Roles que realmente emite el API-RH del docente (distintos del EmployeeRole
// de arriba, que es un campo propio del empleado simulado de este mini-proyecto).
export type AuthRole = "ADMIN" | "HR_MANAGER" | "EMPLOYEE";

export interface AuthUserRole {
  code: AuthRole;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: AuthUserRole;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// --- Tipos de respuesta de la API ---

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- Tipos de navegación ---

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  allowedRoles: AuthRole[];
}
