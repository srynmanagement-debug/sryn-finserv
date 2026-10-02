import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { envConfig } from '../config/env.config';
import { authMiddleware } from '../middleware/auth.middleware';
import { errorMiddleware } from '../middleware/error.middleware';
import { authRouter } from '../modules/auth/auth.router';
import { rolesRouter } from '../modules/roles/roles.router';
import { productsRouter } from '../modules/products/products.router';
import { pricingRouter } from '../modules/pricing/pricing.router';
import { applicationsRouter } from '../modules/applications/applications.router';
import { commissionsRouter } from '../modules/commissions/commissions.router';
import { ledgerRouter } from '../modules/ledger/ledger.router';
import { formsRouter } from '../modules/forms/forms.router';
import { workflowsRouter } from '../modules/workflows/workflows.router';
import { auditRouter } from '../modules/audit/audit.router';
import { documentsRouter } from '../modules/documents/documents.router';
import { partnersRouter } from '../modules/partners/partners.router';
import { hierarchyRouter } from '../modules/hierarchy/hierarchy.router';
import { DatabaseConnection } from '../database/connection';
import { sendSuccess } from '../common/utils/response.util';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Liveness check endpoint
  app.get('/health', (_req, res) => {
    return sendSuccess(
      res,
      { status: 'UP', environment: envConfig.nodeEnv, timestamp: new Date().toISOString() },
      'System Liveness Healthy'
    );
  });

  // Readiness check endpoint
  app.get('/health/ready', async (_req, res) => {
    const db = DatabaseConnection.getInstance();
    const isDbConnected = await db.healthCheck();

    return res.status(isDbConnected ? 200 : 503).json({
      success: isDbConnected,
      status: isDbConnected ? 'READY' : 'DEGRADED',
      components: {
        database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // API router mount
  const apiRouter = express.Router();
  apiRouter.use(authMiddleware);

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/roles', rolesRouter);
  apiRouter.use('/products', productsRouter);
  apiRouter.use('/pricing', pricingRouter);
  apiRouter.use('/applications', applicationsRouter);
  apiRouter.use('/documents', documentsRouter);
  apiRouter.use('/commissions', commissionsRouter);
  apiRouter.use('/ledger', ledgerRouter);
  apiRouter.use('/forms', formsRouter);
  apiRouter.use('/workflows', workflowsRouter);
  apiRouter.use('/audit', auditRouter);
  apiRouter.use('/partners', partnersRouter);
  apiRouter.use('/hierarchy', hierarchyRouter);

  app.use(envConfig.apiPrefix, apiRouter);

  // Global Error Handler
  app.use(errorMiddleware);

  return app;
}
