import dotenv from 'dotenv';
import path from 'path';

// Safely load environment configuration from root or workspace .env files
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const rawLocalAuthFallback = process.env.ENABLE_LOCAL_AUTH_FALLBACK === 'true';

export const envConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'sryn_finserv_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'local_dev_password_only',
    ssl: process.env.DB_SSL === 'true',
    connectionString: process.env.DATABASE_URL || undefined,
  },
  auth: {
    enableLocalAuthFallback: isProduction ? false : rawLocalAuthFallback,
    jwtSecret: process.env.JWT_SECRET || 'development_jwt_secret_key_change_in_production_min32chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID || '',
    clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
    s3Bucket: process.env.AWS_S3_DOCUMENT_BUCKET || '',
    secretsManagerSecretId: process.env.AWS_SECRETS_MANAGER_SECRET_ID || '',
  },
};
