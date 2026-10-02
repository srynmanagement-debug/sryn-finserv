import { Router } from 'express';
import { FormsService } from './forms.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { saveFormSchemaSchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const formsRouter = Router();
const formsService = new FormsService();
const auditService = new AuditService();

// Get Form Schema for Product
formsRouter.get('/schemas/:productId', async (req, res, next) => {
  try {
    const schema = await formsService.getFormSchemaByProductId(req.params.productId);
    return sendSuccess(res, schema, 'Form schema retrieved');
  } catch (err) {
    next(err);
  }
});

// Validate Schema without Saving
formsRouter.post('/schemas/validate', async (req, res) => {
  const validation = formsService.validateSchema(req.body);
  return sendSuccess(res, validation, validation.isValid ? 'Schema is valid' : 'Schema validation failed');
});

// Save Form Schema
formsRouter.post('/schemas', requireAuth, rbacMiddleware('product:update'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = saveFormSchemaSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const saved = await formsService.saveFormSchema(parseRes.data as any);

    await auditService.logEvent({
      action: 'FORM_SCHEMA_SAVED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'FORM_SCHEMA',
      entityId: saved.id,
      newValue: { productId: saved.productId, version: saved.version },
    });

    return sendSuccess(res, saved, `Form schema saved version ${saved.version}`);
  } catch (err) {
    next(err);
  }
});
