import { Router } from 'express';
import { ProductsService } from './products.service';
import { evaluateEligibility } from './eligibility.engine';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';
import { sendSuccess, sendError } from '../../common/utils/response.util';
import { createProductSchema, updateProductSchema, createCategorySchema, createSubcategorySchema } from '@sryn/validation';
import { AuditService } from '../audit/audit.service';

export const productsRouter = Router();
const productsService = new ProductsService();
const auditService = new AuditService();

// Category Endpoints
productsRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await productsService.getCategories();
    return sendSuccess(res, categories, 'Categories retrieved');
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/categories', requireAuth, rbacMiddleware('product:create'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = createCategorySchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }
    const category = await productsService.createCategory(parseRes.data);
    await auditService.logEvent({
      action: 'CATEGORY_CREATED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'CATEGORY',
      entityId: category.id,
      newValue: category,
    });
    return sendSuccess(res, category, 'Category created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Subcategory Endpoints
productsRouter.get('/subcategories', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const subcategories = await productsService.getSubcategories(categoryId);
    return sendSuccess(res, subcategories, 'Subcategories retrieved');
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/subcategories', requireAuth, rbacMiddleware('product:create'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = createSubcategorySchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }
    const subcategory = await productsService.createSubcategory(parseRes.data);
    return sendSuccess(res, subcategory, 'Subcategory created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Partners Endpoints
productsRouter.get('/partners', async (_req, res, next) => {
  try {
    const partners = await productsService.getPartners();
    return sendSuccess(res, partners, 'Partners retrieved');
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/partners', requireAuth, rbacMiddleware('product:create'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const partner = await productsService.createPartner(req.body);
    return sendSuccess(res, partner, 'Partner created', 201);
  } catch (err) {
    next(err);
  }
});

// Product List & Search
productsRouter.get('/', async (req, res, next) => {
  try {
    const { search, categoryId, status, page, limit } = req.query;
    const result = await productsService.listProducts({
      search: search as string,
      categoryId: categoryId as string,
      status: status as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    return sendSuccess(res, result.products, 'Products list', 200, {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
});

// Create Product
productsRouter.post('/', requireAuth, rbacMiddleware('product:create'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = createProductSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const product = await productsService.createProduct(parseRes.data as any);

    await auditService.logEvent({
      action: 'PRODUCT_CREATED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: product.id,
      newValue: product,
    });

    return sendSuccess(res, product, 'Product created in DRAFT status', 201);
  } catch (err) {
    next(err);
  }
});

// Get Product by ID
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.id);
    return sendSuccess(res, product, 'Product details');
  } catch (err) {
    next(err);
  }
});

// Update Product
productsRouter.put('/:id', requireAuth, rbacMiddleware('product:update'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const parseRes = updateProductSchema.safeParse(req.body);
    if (!parseRes.success) {
      return sendError(res, 'Validation error', 400, parseRes.error.format());
    }

    const updated = await productsService.updateProduct(req.params.id, parseRes.data as any);

    await auditService.logEvent({
      action: 'PRODUCT_UPDATED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: updated.id,
      newValue: updated,
    });

    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
});

// Publish Product Lifecycle
productsRouter.post('/:id/publish', requireAuth, rbacMiddleware('product:publish'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const published = await productsService.publishProduct(req.params.id, req.user?.id);

    await auditService.logEvent({
      action: 'PRODUCT_PUBLISHED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: published.id,
      newValue: { version: published.version, status: published.status },
    });

    return sendSuccess(res, published, 'Product published to ACTIVE status');
  } catch (err) {
    next(err);
  }
});

// Pause Product Lifecycle
productsRouter.post('/:id/pause', requireAuth, rbacMiddleware('product:update'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const paused = await productsService.pauseProduct(req.params.id);
    await auditService.logEvent({
      action: 'PRODUCT_PAUSED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: paused.id,
    });
    return sendSuccess(res, paused, 'Product paused');
  } catch (err) {
    next(err);
  }
});

// Resume Product Lifecycle
productsRouter.post('/:id/resume', requireAuth, rbacMiddleware('product:update'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const resumed = await productsService.resumeProduct(req.params.id);
    await auditService.logEvent({
      action: 'PRODUCT_RESUMED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: resumed.id,
    });
    return sendSuccess(res, resumed, 'Product resumed to ACTIVE status');
  } catch (err) {
    next(err);
  }
});

// Archive Product Lifecycle
productsRouter.post('/:id/archive', requireAuth, rbacMiddleware('product:publish'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const archived = await productsService.archiveProduct(req.params.id);
    await auditService.logEvent({
      action: 'PRODUCT_ARCHIVED',
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      entityType: 'PRODUCT',
      entityId: archived.id,
    });
    return sendSuccess(res, archived, 'Product archived');
  } catch (err) {
    next(err);
  }
});

// Create Revision from Active Product
productsRouter.post('/:id/new-version', requireAuth, rbacMiddleware('product:create'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const revision = await productsService.createRevision(req.params.id);
    return sendSuccess(res, revision, `New draft revision v${revision.version} created`, 201);
  } catch (err) {
    next(err);
  }
});

// Get Version History
productsRouter.get('/:id/versions', async (req, res, next) => {
  try {
    const versions = await productsService.getProductVersions(req.params.id);
    return sendSuccess(res, versions, 'Product version history');
  } catch (err) {
    next(err);
  }
});

// Preview Eligibility Rules Evaluation
productsRouter.post('/eligibility/preview', async (req, res, next) => {
  try {
    const { rules, applicantData } = req.body;
    if (!rules || !Array.isArray(rules) || !applicantData) {
      return sendError(res, 'rules array and applicantData object are required', 400);
    }
    const result = evaluateEligibility(rules, applicantData);
    return sendSuccess(res, result, 'Eligibility evaluation preview');
  } catch (err) {
    next(err);
  }
});
