export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'TEAM_LEADER'
  | 'AGENT'
  | 'DISTRIBUTOR'
  | 'RETAILER'
  | 'CUSTOMER';

export interface UserPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  cognitoSub?: string;
  managerId?: string;
  teamLeaderId?: string;
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
}
