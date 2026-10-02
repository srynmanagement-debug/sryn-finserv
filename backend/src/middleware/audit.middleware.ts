import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AuditService } from '../modules/audit/audit.service';

const auditService = new AuditService();

export function auditMiddleware(actionName: string, entityType: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        auditService.logEvent({
          action: actionName,
          actorUserId: req.user?.id,
          actorRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          entityType,
          entityId: req.params.id || 'N/A',
          newValue: req.body,
        }).catch(() => {});
      }
    });
    next();
  };
}
