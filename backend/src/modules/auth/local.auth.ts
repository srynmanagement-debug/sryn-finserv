import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { envConfig } from '../../config/env.config';
import { ForbiddenError, UnauthorizedError } from '../../common/errors/app-error';

export interface DecodedLocalToken {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export function verifyLocalAuthAllowed(): void {
  if (envConfig.isProduction || process.env.NODE_ENV === 'production') {
    throw new ForbiddenError('Local authentication fallback is strictly prohibited in production environments.');
  }
  if (!envConfig.auth.enableLocalAuthFallback) {
    throw new UnauthorizedError('Local authentication fallback is disabled.');
  }
}

export function generateLocalJwt(payload: { userId: string; email: string; role: string; permissions: string[] }): string {
  verifyLocalAuthAllowed();
  return jwt.sign(payload, envConfig.auth.jwtSecret, {
    expiresIn: envConfig.auth.jwtExpiresIn as any,
  });
}

export function verifyLocalJwt(token: string): DecodedLocalToken {
  verifyLocalAuthAllowed();
  try {
    const decoded = jwt.verify(token, envConfig.auth.jwtSecret);
    return decoded as DecodedLocalToken;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired local JWT token');
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
