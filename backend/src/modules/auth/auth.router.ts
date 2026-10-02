import { Router } from 'express';
import { AuthService } from './auth.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { loginSchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const authRouter = Router();
const authService = new AuthService();
const auditService = new AuditService();

authRouter.post('/login', async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation error', 400, parseResult.error.format());
    }

    const { email, password } = parseResult.data;

    try {
      const result = await authService.login(email, password);

      await auditService.logEvent({
        action: 'AUTH_LOGIN_SUCCESS',
        actorUserId: result.user.id,
        actorRole: result.user.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        entityType: 'USER',
        entityId: result.user.id,
      });

      return sendSuccess(res, result, 'Login successful');
    } catch (authError: any) {
      await auditService.logEvent({
        action: 'AUTH_LOGIN_FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        entityType: 'USER',
        entityId: email,
        metadata: { reason: authError.message },
      });

      throw authError;
    }
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user) {
      await auditService.logEvent({
        action: 'AUTH_LOGOUT',
        actorUserId: req.user.id,
        actorRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        entityType: 'USER',
        entityId: req.user.id,
      });
    }

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return sendSuccess(res, req.user, 'Current user profile');
});
