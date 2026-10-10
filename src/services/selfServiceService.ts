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

export const selfServiceService = {
  getProfile: async () => {
    const res = await apiClient.get('/api/v1/self-service/profile');
    return res.data.data as SelfServiceProfile;
  },

  updateContact: async (data: UpdateContactData) => {
    const res = await apiClient.patch('/api/v1/self-service/contact', data);
    return res.data.data as SelfServiceProfile;
  },
};