import { createApp } from './app/app';
import { envConfig } from './config/env.config';
import { DatabaseConnection } from './database/connection';
import { logger } from './common/utils/logger';

async function bootstrap() {
  const db = DatabaseConnection.getInstance();
  
  try {
    await db.getPool();
    const isConnected = await db.healthCheck();
    if (isConnected) {
      logger.info('Database connection established successfully.');
    } else {
      logger.warn('Database health check returned offline. Operating in degraded mode.');
    }
  } catch (err) {
    logger.warn('Failed to connect to PostgreSQL database during startup:', (err as Error).message);
  }

  const app = createApp();

  app.listen(envConfig.port, () => {
    logger.info(`SRYN FinServ Backend API Server running on port ${envConfig.port} [${envConfig.nodeEnv}]`);
    logger.info(`API Base Path: ${envConfig.apiPrefix}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during application startup:', err);
  process.exit(1);
});
