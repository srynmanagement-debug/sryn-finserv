import { Router } from 'express';
import { CommissionsService } from './commissions.service';
import { calculateCommissionTree } from './commission.engine';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { createCommissionRuleSchema, calculateCommissionPreviewSchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const commissionsRouter = Router();
const commissionsService = new CommissionsService();
const auditService = new AuditService();

commissionsRouter.get('/rules/:productId', async (req, res, next) => {
  try {
    const rules = await commissionsService.getCommissionRulesByProductId(req.params.productId);
    return sendSuccess(res, rules, 'Commission rules list');
  } catch (err) {
    next(err);
  }
});

commissionsRouter.post('/rules', requireAuth, rbacMiddleware('commission:manage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = createCommissionRuleSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const rule = await commissionsService.createCommissionRule(parseRes.data as any);

    await auditService.logEvent({
      action: 'COMMISSION_RULE_CREATED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'COMMISSION_RULE',
      entityId: rule.id,
      newValue: rule,
    });

    return sendSuccess(res, rule, 'Commission rule created', 201);
  } catch (err) {
    next(err);
  }
});

commissionsRouter.post('/rules/:id/publish', requireAuth, rbacMiddleware('commission:manage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const published = await commissionsService.publishCommissionRule(req.params.id);
    await auditService.logEvent({
      action: 'COMMISSION_RULE_PUBLISHED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'COMMISSION_RULE',
      entityId: published.id,
    });
    return sendSuccess(res, published, 'Commission rule published');
  } catch (err) {
    next(err);
  }
});

commissionsRouter.post('/preview', async (req, res, next) => {
  try {
    const parseRes = calculateCommissionPreviewSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const rules = await commissionsService.getCommissionRulesByProductId(parseRes.data.productId);
    const tree = calculateCommissionTree(rules, parseRes.data.disbursalAmountPaise, parseRes.data.beneficiaries);

    return sendSuccess(res, tree, 'Commission attribution tree preview calculated');
  } catch (err) {
    next(err);
  }
});
