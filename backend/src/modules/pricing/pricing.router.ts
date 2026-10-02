import { Router } from 'express';
import { PricingService } from './pricing.service';
import { calculatePricing } from './pricing.engine';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { createPricingRuleSchema, calculatePricingPreviewSchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const pricingRouter = Router();
const pricingService = new PricingService();
const auditService = new AuditService();

pricingRouter.get('/rules/:productId', async (req, res, next) => {
  try {
    const rules = await pricingService.getPricingRulesByProductId(req.params.productId);
    return sendSuccess(res, rules, 'Pricing rules list');
  } catch (err) {
    next(err);
  }
});

pricingRouter.post('/rules', requireAuth, rbacMiddleware('pricing:manage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = createPricingRuleSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const rule = await pricingService.createPricingRule(parseRes.data as any);

    await auditService.logEvent({
      action: 'PRICING_RULE_CREATED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRICING_RULE',
      entityId: rule.id,
      newValue: rule,
    });

    return sendSuccess(res, rule, 'Pricing rule created', 201);
  } catch (err) {
    next(err);
  }
});

pricingRouter.post('/rules/:id/publish', requireAuth, rbacMiddleware('pricing:manage'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const published = await pricingService.publishPricingRule(req.params.id);
    await auditService.logEvent({
      action: 'PRICING_RULE_PUBLISHED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRICING_RULE',
      entityId: published.id,
    });
    return sendSuccess(res, published, 'Pricing rule published');
  } catch (err) {
    next(err);
  }
});

pricingRouter.post('/preview', async (req, res, next) => {
  try {
    const parseRes = calculatePricingPreviewSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const rules = await pricingService.getPricingRulesByProductId(parseRes.data.productId);
    const calculation = calculatePricing(rules, parseRes.data.loanAmountPaise);

    return sendSuccess(res, calculation, 'Pricing preview calculated');
  } catch (err) {
    next(err);
  }
});
