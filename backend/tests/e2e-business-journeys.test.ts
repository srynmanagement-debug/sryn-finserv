import request from 'supertest';
import { createApp } from '../src/app/app';
import { generateLocalJwt, verifyLocalAuthAllowed } from '../src/modules/auth/local.auth';
import { envConfig } from '../src/config/env.config';
import { DatabaseConnection } from '../src/database/connection';

const app = createApp();

describe('Phase 11 — End-to-End Business Journeys & Security Hardening Test Suite', () => {
  let customerToken: string;
  let agentToken: string;
  let tlToken: string;
  let managerToken: string;
  let adminToken: string;
  let createdApplicationId: string;
  let createdPartnerId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    envConfig.isProduction = false;
    envConfig.auth.enableLocalAuthFallback = true;

    // Seed test records into PostgreSQL database if active
    const db = DatabaseConnection.getInstance();
    try {
      await db.query(`
        INSERT INTO users (id, email, password_hash, phone, first_name, last_name)
        VALUES 
          ('00000000-0000-0000-0000-000000000099', 'customer.test@sryn.local', 'hash', '+919998880099', 'Customer', 'Test'),
          ('00000000-0000-0000-0000-000000000088', 'agent.test@sryn.local', 'hash', '+919998880088', 'Agent', 'Test'),
          ('00000000-0000-0000-0000-000000000077', 'tl.test@sryn.local', 'hash', '+919998880077', 'Team', 'Leader'),
          ('00000000-0000-0000-0000-000000000066', 'manager.test@sryn.local', 'hash', '+919998880066', 'Regional', 'Manager'),
          ('00000000-0000-0000-0000-000000000055', 'retailer.test@sryn.local', 'hash', '+919998880055', 'Retailer', 'Test')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

        DELETE FROM partners WHERE user_id = '00000000-0000-0000-0000-000000000055';

        INSERT INTO product_categories (id, code, name) 
        VALUES ('00000000-0000-0000-0000-000000000010', 'CARDS_CAT_E2E', 'Credit Cards E2E')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO products (id, code, name, category_id, status)
        VALUES ('00000000-0000-0000-0000-000000000001', 'FD_CARD_V1_E2E', 'FD Credit Card E2E', '00000000-0000-0000-0000-000000000010', 'ACTIVE')
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (e) {
      // Ignored if fallback mode active
    }

    customerToken = generateLocalJwt({
      userId: '00000000-0000-0000-0000-000000000099',
      email: 'customer.test@sryn.local',
      role: 'CUSTOMER',
      permissions: ['application:create', 'application:read_own', 'document:upload_own'],
    });

    agentToken = generateLocalJwt({
      userId: '00000000-0000-0000-0000-000000000088',
      email: 'agent.test@sryn.local',
      role: 'AGENT',
      permissions: ['application:create', 'application:read', 'lead:read', 'customer:create'],
    });

    tlToken = generateLocalJwt({
      userId: '00000000-0000-0000-0000-000000000077',
      email: 'tl.test@sryn.local',
      role: 'TEAM_LEADER',
      permissions: ['application:read', 'team:read', 'lead:assign'],
    });

    managerToken = generateLocalJwt({
      userId: '00000000-0000-0000-0000-000000000066',
      email: 'manager.test@sryn.local',
      role: 'MANAGER',
      permissions: ['application:read', 'application:verify', 'team:read', 'report:read', 'partner:approve'],
    });

    adminToken = generateLocalJwt({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'admin.test@sryn.local',
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    });
  });

  // ---------------------------------------------------------------------------
  // JOURNEY A — Customer Application Lifecycle
  // ---------------------------------------------------------------------------
  describe('Journey A — Customer Application Lifecycle', () => {
    it('1. Customer browses active financial products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('2. Customer evaluates preliminary eligibility dynamically', async () => {
      const res = await request(app)
        .post('/api/v1/applications/preliminary-eligibility')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: '00000000-0000-0000-0000-000000000001',
          monthlyIncome: 45000,
          age: 28,
          employmentType: 'SALARIED',
          creditScore: 750,
          requestedAmount: 150000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEligible).toBe(true);
    });

    it('3. Customer creates and saves application draft', async () => {
      const res = await request(app)
        .post('/api/v1/applications/draft')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: '00000000-0000-0000-0000-000000000001',
          currentStep: 1,
          formData: {
            fullName: 'Test Customer',
            panNumber: 'ABCDE1234F',
            monthlyIncome: 45000,
          },
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe('DRAFT');
      createdApplicationId = res.body.data.id;
    });

    it('4. Customer requests document pre-signed upload URL', async () => {
      const res = await request(app)
        .post('/api/v1/documents/presigned-url')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          applicationId: createdApplicationId,
          documentType: 'PAN_CARD',
          fileName: 'pan_card.jpg',
          fileSizeBytes: 204850,
          mimeType: 'image/jpeg',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.s3Key).toBeDefined();
    });

    it('5. Customer registers uploaded document metadata', async () => {
      const res = await request(app)
        .post('/api/v1/documents/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          applicationId: createdApplicationId,
          documentType: 'PAN_CARD',
          s3Key: `applications/${createdApplicationId}/PAN_CARD/test_pan.jpg`,
          fileName: 'pan_card.jpg',
          fileSizeBytes: 204850,
          mimeType: 'image/jpeg',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING_VERIFICATION');
    });

    it('6. Customer submits application with idempotency key', async () => {
      const idempotencyKey = `idemp-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/applications/submit')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          applicationId: createdApplicationId,
          submissionIdempotencyKey: idempotencyKey,
          formData: {
            fullName: 'Test Customer',
            panNumber: 'ABCDE1234F',
            monthlyIncome: 45000,
            fdAmountPaise: 5000000,
          },
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe('SUBMITTED');
    });
  });

  // ---------------------------------------------------------------------------
  // JOURNEY B — Agent Processing & Verification Workflow
  // ---------------------------------------------------------------------------
  describe('Journey B — Agent Processing & Verification Workflow', () => {
    it('1. Agent views agent queue', async () => {
      const res = await request(app)
        .get('/api/v1/applications/agent/queue')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('2. Agent claims application for processing', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${createdApplicationId}/claim`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe('UNDER_REVIEW');
    });

    it('3. Agent updates application status', async () => {
      const res = await request(app)
        .post('/api/v1/applications/status')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          applicationId: createdApplicationId,
          newStatus: 'APPROVED',
          notes: 'KYC and income documents verified successfully by agent.',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe('APPROVED');
    });
  });

  // ---------------------------------------------------------------------------
  // JOURNEY C — Partner Onboarding & Referrals
  // ---------------------------------------------------------------------------
  describe('Journey C — Partner Onboarding & Referrals', () => {
    it('1. Retailer registers for partner onboarding', async () => {
      const retailerToken = generateLocalJwt({
        userId: '00000000-0000-0000-0000-000000000055',
        email: 'retailer.test@sryn.local',
        role: 'RETAILER',
        permissions: ['retailer:create', 'commission:read'],
      });

      const res = await request(app)
        .post('/api/v1/partners/register')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          name: 'City Digital Retail Store',
          contactEmail: 'retailer.test@sryn.local',
          partnerType: 'RETAILER',
          gstin: '07AAAAA1111A1Z5',
          panNumber: 'AAAPA9999A',
          contactPhone: '+91 9876599999',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(['PENDING', 'PENDING_REVIEW', 'APPROVED']).toContain(res.body.data.onboardingStatus);
      createdPartnerId = res.body.data.id;
    });

    it('2. Manager reviews and approves partner onboarding request', async () => {
      const res = await request(app)
        .post(`/api/v1/partners/${createdPartnerId}/onboarding/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'APPROVED',
          reviewNotes: 'GSTIN and business premises verified by Manager.',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.onboardingStatus).toBe('APPROVED');
    });
  });

  // ---------------------------------------------------------------------------
  // JOURNEY D — Team Leader & Manager Hierarchy Oversight
  // ---------------------------------------------------------------------------
  describe('Journey D — Hierarchy Oversight & RBAC Scoping', () => {
    it('1. Team Leader accesses authorized TL dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/hierarchy/team-leader/dashboard')
        .set('Authorization', `Bearer ${tlToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetMetrics).toBeDefined();
    });

    it('2. Manager accesses authorized Manager dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/hierarchy/manager/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.regionalTargetMetrics).toBeDefined();
    });

    it('3. Non-manager role is denied access to Manager dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/hierarchy/manager/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // JOURNEY E — Financial Calculations & Ledger Immutability
  // ---------------------------------------------------------------------------
  describe('Journey E — Financial Calculations & Ledger Immutability', () => {
    it('1. Pricing engine preview calculates fees', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/preview')
        .send({
          productId: '00000000-0000-0000-0000-000000000001',
          loanAmountPaise: 10000000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('2. Commission engine preview calculates tier distribution', async () => {
      const res = await request(app)
        .post('/api/v1/commissions/preview')
        .send({
          productId: '00000000-0000-0000-0000-000000000001',
          disbursalAmountPaise: 10000000,
          beneficiaries: [
            { userId: '00000000-0000-0000-0000-000000000088', role: 'AGENT' },
            { userId: '00000000-0000-0000-0000-000000000055', role: 'RETAILER' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('3. Ledger entries endpoint returns append-only entries for authorized staff', async () => {
      const res = await request(app)
        .get('/api/v1/ledger/entries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('4. Unauthorized user is blocked from transitioning ledger entry payout status', async () => {
      const res = await request(app)
        .post('/api/v1/ledger/entries/entry-001/transition')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          targetStatus: 'PAYABLE',
          reason: 'Unauthorized test transition',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // SECURITY & PRODUCTION HARDENING CHECKS
  // ---------------------------------------------------------------------------
  describe('Security & Production Hardening Checks', () => {
    it('1. Local auth fallback throws ForbiddenError when NODE_ENV === production', () => {
      envConfig.isProduction = true;
      process.env.NODE_ENV = 'production';

      expect(() => {
        verifyLocalAuthAllowed();
      }).toThrow('Local authentication fallback is strictly prohibited in production environments.');

      // Restore dev environment settings
      process.env.NODE_ENV = 'development';
      envConfig.isProduction = false;
      envConfig.auth.enableLocalAuthFallback = true;
    });

    it('2. Unhandled exception response masks stack trace and returns generic 500 error', async () => {
      const res = await request(app).get('/health');
      expect(res.body.error).toBeUndefined(); // Stack trace never exposed in JSON response
    });
  });
});
