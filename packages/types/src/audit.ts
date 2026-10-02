export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'CONFIG_CHANGE'
  | 'PRODUCT_CHANGE'
  | 'PRICING_CHANGE'
  | 'COMMISSION_CHANGE'
  | 'APPLICATION_CHANGE'
  | 'KYC_ACTION'
  | 'DOCUMENT_ACTION'
  | 'PAYOUT_ACTION'
  | 'USER_ROLE_CHANGE';

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  actorUserId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
}
