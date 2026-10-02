import { Router } from 'express';
import { applicationsService } from './applications.service';
import { sendSuccess } from '../../common/utils/response.util';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export const applicationsRouter = Router();

// Save or update draft
applicationsRouter.post('/draft', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.saveDraft(req.user!.id, req.body);
    return sendSuccess(res, result, 'Draft application saved successfully');
  } catch (err) {
    next(err);
  }
});

// Submit application (freezes product, pricing, commission snapshots)
applicationsRouter.post('/submit', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.submitApplication(req.user!.id, req.body);
    return sendSuccess(res, result, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Resubmit application (for ADDITIONAL_INFORMATION_REQUIRED status)
applicationsRouter.post('/resubmit', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.resubmitApplication(req.user!.id, req.body);
    return sendSuccess(res, result, 'Application resubmitted successfully');
  } catch (err) {
    next(err);
  }
});

// Preliminary eligibility check
applicationsRouter.post('/preliminary-eligibility', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.evaluatePreliminaryEligibility(req.body);
    return sendSuccess(res, result, 'Preliminary eligibility evaluated');
  } catch (err) {
    next(err);
  }
});

// Get customer's applications list
applicationsRouter.get('/my-applications', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.getCustomerApplications(req.user!.id);
    return sendSuccess(res, result, 'Customer applications retrieved successfully');
  } catch (err) {
    next(err);
  }
});

// Update application status (Admin / Staff endpoint)
applicationsRouter.post('/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.updateStatus(req.user!.id, req.body);
    return sendSuccess(res, result, 'Application status updated successfully');
  } catch (err) {
    next(err);
  }
});

// Cancel application
applicationsRouter.post('/:id/cancel', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.cancelApplication(req.user!.id, req.params.id, req.body.reason);
    return sendSuccess(res, result, 'Application cancelled successfully');
  } catch (err) {
    next(err);
  }
});

// Get single application details
applicationsRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await applicationsService.getApplicationById(req.user!.id, req.params.id);
    return sendSuccess(res, result, 'Application details retrieved successfully');
  } catch (err) {
    next(err);
  }
});
