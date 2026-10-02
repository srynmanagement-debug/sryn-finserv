import { Router } from 'express';
import { LedgerService } from './ledger.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { ledgerTransitionSchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const ledgerRouter = Router();
const ledgerService = new LedgerService();
const auditService = new AuditService();

ledgerRouter.get('/entries', requireAuth, rbacMiddleware('ledger:view'), async (req, res, next) => {
  try {
    const { beneficiaryUserId, applicationId, status } = req.query;
    const entries = await ledgerService.getLedgerEntries({
      beneficiaryUserId: beneficiaryUserId as string,
      applicationId: applicationId as string,
      status: status as any,
    });
    return sendSuccess(res, entries, 'Commission ledger entries');
  } catch (err) {
    next(err);
  }
});

ledgerRouter.get('/entries/:id', requireAuth, rbacMiddleware('ledger:view'), async (req, res, next) => {
  try {
    const entry = await ledgerService.getLedgerEntryById(req.params.id);
    return sendSuccess(res, entry, 'Ledger entry details');
  } catch (err) {
    next(err);
  }
});

ledgerRouter.post('/entries', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const entry = await ledgerService.createLedgerEntry(req.body);
    return sendSuccess(res, entry, 'Ledger entry created', 201);
  } catch (err) {
    next(err);
  }
});

ledgerRouter.post('/entries/:id/transition', requireAuth, rbacMiddleware('ledger:payout_approve'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = ledgerTransitionSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const { targetStatus, reason, payoutReference } = parseRes.data;

    const actor = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const transitioned = await ledgerService.transitionStatus(
      req.params.id,
      targetStatus,
      actor,
      reason,
      payoutReference
    );

    await auditService.logEvent({
      action: `LEDGER_TRANSITION_${targetStatus}`,
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'COMMISSION_LEDGER',
      entityId: transitioned.id,
      newValue: { targetStatus, reason, payoutReference },
    });

    return sendSuccess(res, transitioned, `Ledger entry transitioned to ${targetStatus}`);
  } catch (err) {
    next(err);
  }
});
