import request from 'supertest';
import { createApp } from '../src/app/app';
import { generateLocalJwt } from '../src/modules/auth/local.auth';
import { envConfig } from '../src/config/env.config';

const app = createApp();

describe('Pricing, Commission & Ledger REST API Integration Tests', () => {
  let adminToken: string;
  let productId: string;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    envConfig.isProduction = false;
    envConfig.auth.enableLocalAuthFallback = true;
    productId = '00000000-0000-0000-0000-000000000001';

    adminToken = generateLocalJwt({
      userId: 'admin-user-1',
      email: 'admin@sryn.local',
      role: 'ADMIN',
      permissions: ['pricing:manage', 'commission:manage', 'ledger:view', 'ledger:payout_approve'],
    });
  });

  it('POST /api/v1/pricing/rules should allow ADMIN to create a pricing rule draft', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        ruleCode: 'PF_STANDARD_2',
        name: 'Standard Processing Fee 2%',
        feeType: 'PROCESSING_FEE',
        calculationType: 'PERCENTAGE',
        percentageBps: 200,
        taxes: [{ taxCode: 'GST', taxRateBps: 1800, isInclusive: false }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ruleCode).toBe('PF_STANDARD_2');
  });

  it('POST /api/v1/pricing/preview should calculate pricing breakdown', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/preview')
      .send({
        productId,
        loanAmountPaise: 50000000, // ₹5,00,000
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.inputLoanAmountPaise).toBe(50000000);
  });

  it('POST /api/v1/commissions/rules should allow ADMIN to create commission rule draft', async () => {
    const res = await request(app)
      .post('/api/v1/commissions/rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        targetRole: 'AGENT',
        ruleCode: 'COMM_AGENT_15',
        name: 'Agent Commission 1.5%',
        calculationType: 'PERCENTAGE',
        percentageBps: 150,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ruleCode).toBe('COMM_AGENT_15');
  });

  it('GET /api/v1/ledger/entries should return ledger list for authorized ledger:view role', async () => {
    const res = await request(app)
      .get('/api/v1/ledger/entries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
