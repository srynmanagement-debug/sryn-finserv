import { DatabaseConnection } from '../../database/connection';
import { logger } from '../../common/utils/logger';

export interface AuditLogData {
  action: string;
  actorUserId?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'creditcardnumber',
  'cvv',
  'pannumber',
  'aadhaarnumber',
]);

export function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AuditService {
  private db = DatabaseConnection.getInstance();

  public async logEvent(data: AuditLogData): Promise<void> {
    const sanitizedOld = redactSensitiveData(data.oldValue);
    const sanitizedNew = redactSensitiveData(data.newValue);
    const sanitizedMeta = redactSensitiveData(data.metadata) || {};

    const isActorUuid = data.actorUserId ? UUID_REGEX.test(data.actorUserId) : false;
    const actorUuid = isActorUuid ? data.actorUserId : null;
    if (data.actorUserId && !isActorUuid) {
      sanitizedMeta.actorIdentifier = data.actorUserId;
    }

    logger.info(`[AUDIT] Action: ${data.action} | Entity: ${data.entityType}:${data.entityId} | Actor: ${data.actorUserId || 'ANONYMOUS'}`);

    try {
      await this.db.query(
        `INSERT INTO audit_logs (action, actor_user_id, actor_role, ip_address, user_agent, entity_type, entity_id, old_value, new_value, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          data.action,
          actorUuid,
          data.actorRole || null,
          data.ipAddress || null,
          data.userAgent || null,
          data.entityType,
          data.entityId,
          sanitizedOld ? JSON.stringify(sanitizedOld) : null,
          sanitizedNew ? JSON.stringify(sanitizedNew) : null,
          Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : null,
        ]
      );
    } catch (err) {
      logger.warn('[AuditService] Failed to persist audit log to PostgreSQL:', (err as Error).message);
    }
  }
}
