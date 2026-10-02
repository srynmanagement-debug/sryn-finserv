import { UserRepository } from '../../database/repositories/user.repository';
import { CognitoAuthVerifier } from './cognito.verifier';
import { verifyLocalAuthAllowed, comparePassword, generateLocalJwt, verifyLocalJwt } from './local.auth';
import { UnauthorizedError } from '../../common/errors/app-error';
import { envConfig } from '../../config/env.config';
import { UserRole } from '@sryn/types';

export class AuthService {
  private userRepo = new UserRepository();
  private cognitoVerifier = new CognitoAuthVerifier();

  public async login(email: string, password?: string): Promise<{ token: string; user: any }> {
    // 1. If Cognito token passed or Cognito authentication configured
    // In local fallback mode:
    verifyLocalAuthAllowed();

    if (!password) {
      throw new UnauthorizedError('Password is required for authentication');
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials or inactive account');
    }

    if (user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedError('Invalid credentials');
      }
    }

    const token = generateLocalJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
      },
    };
  }

  public async verifyTokenAndResolveUser(token: string): Promise<{
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
    cognitoSub?: string;
  }> {
    // 1. Try Cognito verification if configured
    if (this.cognitoVerifier.isConfigured()) {
      const cognitoPayload = await this.cognitoVerifier.verifyToken(token);
      if (cognitoPayload) {
        const user = await this.userRepo.findByEmail(cognitoPayload.email || cognitoPayload.username || '');
        if (user) {
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            cognitoSub: cognitoPayload.sub,
          };
        }
      }
    }

    // 2. Fallback to local JWT verification if allowed
    if (envConfig.auth.enableLocalAuthFallback && !envConfig.isProduction) {
      const decoded = verifyLocalJwt(token);
      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole,
        permissions: decoded.permissions,
      };
    }

    throw new UnauthorizedError('Authentication token verification failed');
  }
}
