import { Router } from 'express';
import { sendSuccess } from '../../common/utils/response.util';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

export const auditRouter = Router();

auditRouter.get('/logs', rbacMiddleware('audit:read'), (req, res) => {
  return sendSuccess(res, [], 'Audit trail logs');
});
