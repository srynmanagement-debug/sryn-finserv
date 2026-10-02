import { rbacMiddleware, requireRole, requireOwnershipOrRole } from '../src/middleware/rbac.middleware';
import { AuthenticatedRequest } from '../src/middleware/auth.middleware';

describe('RBAC Authorization Guards', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: any;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = { params: {}, body: {} };
    mockRes = {};
    nextFn = jest.fn();
  });

  it('should default deny when request context has no authenticated user', () => {
    const middleware = rbacMiddleware('product:create');
    middleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should allow user possessing exact required permission', () => {
    mockReq.user = {
      id: 'user-1',
      email: 'admin@sryn.local',
      role: 'ADMIN',
      permissions: ['product:create', 'product:read'],
    };

    const middleware = rbacMiddleware('product:create');
    middleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(); // Called without error
  });

  it('should deny user lacking required permission', () => {
    mockReq.user = {
      id: 'user-1',
      email: 'agent@sryn.local',
      role: 'AGENT',
      permissions: ['application:create'],
    };

    const middleware = rbacMiddleware('product:create');
    middleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should allow SUPER_ADMIN role regardless of permissions array', () => {
    mockReq.user = {
      id: 'super-admin-1',
      email: 'superadmin@sryn.local',
      role: 'SUPER_ADMIN',
      permissions: [],
    };

    const middleware = rbacMiddleware('restricted:permission');
    middleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });

  it('should enforce role checks correctly with requireRole', () => {
    mockReq.user = {
      id: 'manager-1',
      email: 'manager@sryn.local',
      role: 'MANAGER',
      permissions: [],
    };

    const roleMiddleware = requireRole(['MANAGER', 'ADMIN']);
    roleMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });

  it('should enforce resource ownership or elevated role check', () => {
    mockReq.user = {
      id: 'user-owner-123',
      email: 'customer@sryn.local',
      role: 'CUSTOMER',
      permissions: [],
    };
    mockReq.params = { userId: 'user-owner-123' };

    const ownershipMiddleware = requireOwnershipOrRole('userId', ['ADMIN']);
    ownershipMiddleware(mockReq as AuthenticatedRequest, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalledWith(); // Allowed due to ownership match
  });
});
