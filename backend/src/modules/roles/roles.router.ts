import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@sryn/config';
import { SYSTEM_PERMISSIONS } from '../../database/seeds/seed';
import { UserRepository } from '../../database/repositories/user.repository';
import { AuditService } from '../audit/audit.service';
import { ForbiddenError } from '../../common/errors/app-error';

export const rolesRouter = Router();
const userRepo = new UserRepository();
const auditService = new AuditService();

rolesRouter.get('/', requireAuth, (_req, res) => {
  const rolesList = Object.keys(SYSTEM_ROLES).map((roleKey) => ({
    code: roleKey,
    name: roleKey.replace('_', ' '),
    permissions: DEFAULT_ROLE_PERMISSIONS[roleKey] || [],
  }));
  return sendSuccess(res, rolesList, 'System roles retrieved');
});

rolesRouter.get('/permissions', requireAuth, (_req, res) => {
  return sendSuccess(res, SYSTEM_PERMISSIONS, 'System permissions catalog');
});

rolesRouter.post('/assign', requireAuth, rbacMiddleware('role:assign'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, roleCode } = req.body;

    if (!userId || !roleCode) {
      return sendError(res, 'userId and roleCode are required', 400);
    }

    // Prevent users from granting themselves elevated roles
    if (req.user?.id === userId) {
      throw new ForbiddenError('Self-elevation of roles is strictly prohibited');
    }

    if (!Object.values(SYSTEM_ROLES).includes(roleCode)) {
      return sendError(res, `Invalid role code: ${roleCode}`, 400);
    }

    const success = await userRepo.assignRole(userId, roleCode);

    await auditService.logEvent({
      action: 'USER_ROLE_ASSIGNED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      entityType: 'USER_ROLE',
      entityId: userId,
      newValue: { roleCode },
    });

    return sendSuccess(res, { userId, roleCode, updated: success }, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
});
