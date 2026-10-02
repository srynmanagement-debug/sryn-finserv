import { Router } from 'express';
import { partnersService } from './partners.service';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export const partnersRouter = Router();

// Partner onboarding submission
partnersRouter.post('/register', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.registerPartner(req.user!.id, req.body);
    return sendSuccess(res, result, 'Partner onboarding submitted successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Partner profile
partnersRouter.get('/profile', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.getPartnerProfile(req.user!.id);
    return sendSuccess(res, result, 'Partner profile retrieved');
  } catch (err) {
    next(err);
  }
});

// Partner dashboard summary
partnersRouter.get('/dashboard', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.getPartnerDashboard(req.user!.id);
    return sendSuccess(res, result, 'Partner dashboard metrics retrieved');
  } catch (err) {
    next(err);
  }
});

// Create customer referral
partnersRouter.post('/referrals', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.createReferral(req.user!.id, req.body);
    return sendSuccess(res, result, 'Customer referral created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get partner referrals list
partnersRouter.get('/referrals', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.getPartnerReferrals(req.user!.id);
    return sendSuccess(res, result, 'Partner referrals retrieved');
  } catch (err) {
    next(err);
  }
});

// Get partner commission ledger
partnersRouter.get('/commissions', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await partnersService.getPartnerCommissions(req.user!.id);
    return sendSuccess(res, result, 'Partner commissions retrieved');
  } catch (err) {
    next(err);
  }
});

// Admin: Onboarding review queue
partnersRouter.get(['/onboarding/queue', '/admin/onboarding-queue'], async (req: AuthenticatedRequest, res, next) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const result = await partnersService.getAdminOnboardingQueue(statusFilter);
    return sendSuccess(res, { queue: result }, 'Partner onboarding queue retrieved');
  } catch (err) {
    next(err);
  }
});

// Admin: Review partner onboarding decision
partnersRouter.post(['/:id/onboarding/review', '/:id/onboarding-review'], async (req: AuthenticatedRequest, res, next) => {
  try {
    const { action, status, notes, reviewNotes, assignedProductIds } = req.body;
    const decisionAction = action || status;
    const noteText = notes || reviewNotes;
    const result = await partnersService.reviewPartnerOnboarding(
      req.user!.id,
      req.params.id,
      decisionAction,
      noteText,
      assignedProductIds
    );
    return sendSuccess(res, result, `Partner onboarding ${decisionAction} executed`);
  } catch (err) {
    next(err);
  }
});
