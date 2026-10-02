import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../common/errors/app-error';

export function rbacMiddleware(requiredPermission: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required for authorized operations'));
    }

    const { permissions, role } = req.user;

    // Super Admin & wildcards bypass permission checks
    if (role === 'SUPER_ADMIN' || permissions.includes('*') || permissions.includes(requiredPermission)) {
      return next();
    }

    return next(new ForbiddenError(`Access denied: Missing required permission [${requiredPermission}]`));
  };
}

export function requireRole(allowedRoles: string | string[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required for authorized operations'));
    }

    if (req.user.role === 'SUPER_ADMIN' || rolesArray.includes(req.user.role)) {
      return next();
    }

    return next(new ForbiddenError(`Access denied: Required role [${rolesArray.join(', ')}]`));
  };
}

export function requireOwnershipOrRole(ownerIdParamName: string, allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required for authorized operations'));
    }

    const resourceOwnerId = req.params[ownerIdParamName] || req.body[ownerIdParamName];

    if (
      req.user.role === 'SUPER_ADMIN' ||
      allowedRoles.includes(req.user.role) ||
      (resourceOwnerId && req.user.id === resourceOwnerId)
    ) {
      return next();
    }

    return next(new ForbiddenError('Access denied: You do not own this resource or possess elevated permissions'));
  };
}
