import request from 'supertest';
import { createApp } from '../src/app/app';
import { generateLocalJwt } from '../src/modules/auth/local.auth';
import { envConfig } from '../src/config/env.config';

const app = createApp();

describe('API Foundation Endpoints & Health Checks', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    envConfig.isProduction = false;
    envConfig.auth.enableLocalAuthFallback = true;
  });

  it('GET /health should return 200 with Liveness status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('GET /health/ready should return health status envelope', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body.components).toBeDefined();
  });

  it('POST /api/v1/auth/login with invalid payload should return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation error');
  });

  it('GET /api/v1/roles without token should return 401 Unauthorized due to requireAuth guard', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/roles with valid bearer token should return 200 with system roles list', async () => {
    const validToken = generateLocalJwt({
      userId: 'user-1',
      email: 'admin@sryn.local',
      role: 'ADMIN',
      permissions: ['role:manage'],
    });

    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
