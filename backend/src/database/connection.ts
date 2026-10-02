import { Pool, PoolClient, QueryResult } from 'pg';
import { envConfig } from '../config/env.config';
import { logger } from '../common/utils/logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;
  private isPoolInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getPool(): Promise<Pool> {
    if (this.pool && this.isPoolInitialized) {
      return this.pool;
    }

    let connectionConfig: any;

    if (envConfig.db.connectionString) {
      connectionConfig = {
        connectionString: envConfig.db.connectionString,
        ssl: envConfig.db.ssl ? { rejectUnauthorized: false } : false,
      };
    } else {
      connectionConfig = {
        host: envConfig.db.host,
        port: envConfig.db.port,
        database: envConfig.db.name,
        user: envConfig.db.user,
        password: envConfig.db.password,
        ssl: envConfig.db.ssl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      };
    }

    this.pool = new Pool(connectionConfig);

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client pool', err);
    });

    this.isPoolInitialized = true;
    logger.info(`PostgreSQL pool initialized targeting ${connectionConfig.host || 'connectionString'}:${connectionConfig.port || ''}/${connectionConfig.database || ''}`);
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const pool = await this.getPool();
    return pool.query(text, params);
  }

  public async getClient(): Promise<PoolClient> {
    const pool = await this.getPool();
    return pool.connect();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as alive');
      return result.rows[0]?.alive === 1;
    } catch (error) {
      logger.warn('PostgreSQL health check failed:', (error as Error).message);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      logger.info('Closing PostgreSQL database pool connection...');
      await this.pool.end();
      this.pool = null;
      this.isPoolInitialized = false;
    }
  }

  public async fetchSecretsManagerDbCredentials(): Promise<void> {
    if (!envConfig.aws.secretsManagerSecretId) {
      return;
    }
    logger.info(`[AWS Secrets Manager] Placeholder fetching DB credentials for secret: ${envConfig.aws.secretsManagerSecretId}`);
  }
}
