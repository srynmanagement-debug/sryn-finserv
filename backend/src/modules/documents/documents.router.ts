import { Router } from 'express';
import { documentsService } from './documents.service';
import { sendSuccess } from '../../common/utils/response.util';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export const documentsRouter = Router();

// Request S3 presigned URL for document upload
documentsRouter.post('/presigned-url', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await documentsService.generatePresignedUrl(req.user!.id, req.body);
    return sendSuccess(res, result, 'Presigned URL generated successfully');
  } catch (err) {
    next(err);
  }
});

// Register uploaded document metadata in DB
documentsRouter.post('/register', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await documentsService.registerDocument(req.user!.id, req.body);
    return sendSuccess(res, result, 'Document registered successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get documents for an application
documentsRouter.get('/application/:applicationId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await documentsService.getApplicationDocuments(req.user!.id, req.params.applicationId);
    return sendSuccess(res, result, 'Application documents fetched successfully');
  } catch (err) {
    next(err);
  }
});

// Verify or reject document (Staff operation)
documentsRouter.post('/:id/verify', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const result = await documentsService.verifyDocument(req.user!.id, req.params.id, status, rejectionReason);
    return sendSuccess(res, result, `Document status updated to ${status}`);
  } catch (err) {
    next(err);
  }
});
