import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { UnauthorizedError } from '../common/errors/app-error';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    cognitoSub?: string;
  };
}

const authService = new AuthService();

export async function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Unauthenticated request context
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const userContext = await authService.verifyTokenAndResolveUser(token);
    req.user = userContext;
    return next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid, expired, or unverified authentication token'));
  }
}

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required to access this resource'));
  }
  return next();
}
