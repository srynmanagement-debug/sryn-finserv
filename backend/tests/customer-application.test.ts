import { applicationsService } from '../src/modules/applications/applications.service';
import { DatabaseConnection } from '../src/database/connection';

describe('Customer Application Lifecycle & State Machine', () => {
  const mockCustomerId = '00000000-0000-0000-0000-000000000099';
  const mockProductId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const db = DatabaseConnection.getInstance();
    try {
      await db.query(`
        INSERT INTO users (id, email, password_hash, phone, first_name, last_name)
        VALUES ('${mockCustomerId}', 'customer_app_test_unique@sryn.local', 'hash', '+919998887776', 'Customer', 'Test')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
      `);
      await db.query(`
        INSERT INTO product_categories (id, code, name) VALUES ('00000000-0000-0000-0000-000000000010', 'LOAN_CAT_TEST', 'Loans Test')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO products (id, code, name, category_id, status)
        VALUES ('${mockProductId}', 'PERSONAL_LOAN_V1_TEST', 'Personal Loan Test', '00000000-0000-0000-0000-000000000010', 'ACTIVE')
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (e) {
      console.error('beforeAll seed error:', e);
    }
  });

  it('should evaluate preliminary eligibility with disclaimers', async () => {
    const res = await applicationsService.evaluatePreliminaryEligibility({
      productId: mockProductId,
      monthlyIncome: 45000,
      age: 28,
      employmentType: 'SALARIED',
      creditScore: 750,
      requestedAmount: 200000,
    });

    expect(res.isEligible).toBe(true);
    expect(res.estimatedMaxAmount).toBe(200000);
    expect(res.isPreliminary).toBe(true);
    expect(res.disclaimer).toContain('preliminary estimation');
    expect(res.rulesEvaluated.length).toBe(3);
  });

  it('should reject preliminary eligibility for underage customer', async () => {
    const res = await applicationsService.evaluatePreliminaryEligibility({
      productId: mockProductId,
      monthlyIncome: 50000,
      age: 18,
      employmentType: 'SALARIED',
      creditScore: 750,
    });

    expect(res.isEligible).toBe(false);
    expect(res.estimatedMaxAmount).toBe(0);
  });

  it('should create and update draft application in PostgreSQL', async () => {
    const draft = await applicationsService.saveDraft(mockCustomerId, {
      productId: mockProductId,
      formData: { fullName: 'John Doe', monthlyIncome: 50000 },
      currentStep: 1,
    });

    expect(draft.id).toBeDefined();
    expect(draft.currentStatus).toBe('DRAFT');
    expect(draft.formData.fullName).toBe('John Doe');

    const updatedDraft = await applicationsService.saveDraft(mockCustomerId, {
      applicationId: draft.id,
      productId: mockProductId,
      formData: { fullName: 'John Doe Updated', monthlyIncome: 55000 },
      currentStep: 2,
    });

    expect(updatedDraft.id).toBe(draft.id);
    expect(updatedDraft.currentStep).toBe(2);
    expect(updatedDraft.formData.fullName).toBe('John Doe Updated');
  });

  it('should submit application with idempotency key and snapshot freezing in PostgreSQL', async () => {
    const draft = await applicationsService.saveDraft(mockCustomerId, {
      productId: mockProductId,
      formData: { fullName: 'Jane Doe', monthlyIncome: 75000 },
      currentStep: 2,
    });

    const idempotencyKey = `idemp_test_${Date.now()}`;
    const submitted = await applicationsService.submitApplication(mockCustomerId, {
      applicationId: draft.id,
      submissionIdempotencyKey: idempotencyKey,
      formData: { fullName: 'Jane Doe Final', monthlyIncome: 75000 },
    });

    expect(submitted.currentStatus).toBe('SUBMITTED');
    expect(submitted.submissionIdempotencyKey).toBe(idempotencyKey);
    expect(submitted.pricingRuleSnapshot).toBeDefined();

    // Re-submission with same idempotency key should return same application idempotently
    const idempotentResult = await applicationsService.submitApplication(mockCustomerId, {
      applicationId: draft.id,
      submissionIdempotencyKey: idempotencyKey,
      formData: { fullName: 'Jane Doe Final', monthlyIncome: 75000 },
    });

    expect(idempotentResult.id).toBe(submitted.id);
    expect(idempotentResult.submissionIdempotencyKey).toBe(idempotencyKey);
  });
});
