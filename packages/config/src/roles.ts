export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TEAM_LEADER: 'TEAM_LEADER',
  AGENT: 'AGENT',
  DISTRIBUTOR: 'DISTRIBUTOR',
  RETAILER: 'RETAILER',
  CUSTOMER: 'CUSTOMER',
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['product:*', 'user:*', 'application:*', 'report:*', 'pricing:*', 'commission:*'],
  MANAGER: ['application:read', 'application:verify', 'team:read', 'report:read'],
  TEAM_LEADER: ['application:read', 'team:read', 'lead:assign'],
  AGENT: ['application:create', 'application:read', 'lead:read', 'customer:create'],
  DISTRIBUTOR: ['retailer:create', 'retailer:read', 'commission:read'],
  RETAILER: ['customer:create', 'application:create', 'application:read', 'commission:read'],
  CUSTOMER: ['application:create', 'application:read_own', 'document:upload_own'],
};
