import { generateLocalJwt, verifyLocalJwt, hashPassword, comparePassword, verifyLocalAuthAllowed } from '../src/modules/auth/local.auth';
import { envConfig } from '../src/config/env.config';

describe('Authentication & JWT Verification', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    envConfig.isProduction = false;
    envConfig.auth.enableLocalAuthFallback = true;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should generate and verify valid local JWT token', () => {
    const payload = {
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'test@sryn.local',
      role: 'ADMIN',
      permissions: ['product:create'],
    };

    const token = generateLocalJwt(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyLocalJwt(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.permissions).toEqual(payload.permissions);
  });

  it('should reject invalid or tampered JWT tokens', () => {
    expect(() => {
      verifyLocalJwt('invalid.token.structure');
    }).toThrow('Invalid or expired local JWT token');
  });

  it('should hash and compare passwords securely using bcrypt', async () => {
    const rawPassword = 'SecretPassword123!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    const matches = await comparePassword(rawPassword, hashed);
    expect(matches).toBe(true);

    const wrongMatches = await comparePassword('WrongPassword', hashed);
    expect(wrongMatches).toBe(false);
  });

  it('should STRICTLY refuse local authentication fallback in production environment', () => {
    process.env.NODE_ENV = 'production';
    envConfig.isProduction = true;

    expect(() => {
      verifyLocalAuthAllowed();
    }).toThrow('Local authentication fallback is strictly prohibited in production environments.');
  });
});
