import request from 'supertest';
import { createApp } from '../src/app/app';
import { generateLocalJwt } from '../src/modules/auth/local.auth';
import { envConfig } from '../src/config/env.config';

const app = createApp();

describe('Product Engine & Form Schema REST API Integration Tests', () => {
  let superAdminToken: string;
  let regularAgentToken: string;
  const validCategoryId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    envConfig.isProduction = false;
    envConfig.auth.enableLocalAuthFallback = true;

    superAdminToken = generateLocalJwt({
      userId: 'admin-1',
      email: 'admin@sryn.local',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    });

    regularAgentToken = generateLocalJwt({
      userId: 'agent-1',
      email: 'agent@sryn.local',
      role: 'AGENT',
      permissions: ['application:create'],
    });
  });

  it('GET /api/v1/products/categories should return product categories list', async () => {
    const res = await request(app).get('/api/v1/products/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/products should allow SUPER_ADMIN to create a DRAFT product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: 'API_TEST_CARD',
        name: 'API Test Credit Card',
        categoryId: validCategoryId,
        description: 'Created via API test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('POST /api/v1/products should deny regular AGENT without product:create permission', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${regularAgentToken}`)
      .send({
        code: 'AGENT_UNAUTHORIZED_CARD',
        name: 'Agent Card',
        categoryId: validCategoryId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/products/eligibility/preview should evaluate rules preview', async () => {
    const res = await request(app)
      .post('/api/v1/products/eligibility/preview')
      .send({
        rules: [
          {
            ruleCode: 'MIN_SALARY',
            fieldName: 'income',
            operator: 'GREATER_THAN',
            expectedValue: 30000,
            errorMessage: 'Income too low',
          },
        ],
        applicantData: { income: 50000 },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isEligible).toBe(true);
  });
});
