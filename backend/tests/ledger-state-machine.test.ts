import { LedgerService } from '../src/modules/ledger/ledger.service';

describe('Commission Ledger State Machine & Separation of Duties', () => {
  let ledgerService: LedgerService;

  beforeEach(() => {
    ledgerService = new LedgerService();
  });

  it('should enforce state machine sequence PENDING -> APPROVED -> PAYABLE -> PAID', async () => {
    const entry = await ledgerService.createLedgerEntry({
      applicationId: 'app-1',
      beneficiaryUserId: 'beneficiary-user-999',
      beneficiaryRole: 'AGENT',
      ruleId: 'rule-1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 150000, // ₹1,500
    });

    expect(entry.status).toBe('PENDING');

    const adminActor = { id: 'admin-user-888', role: 'ADMIN' };

    // 1. PENDING -> APPROVED
    const approved = await ledgerService.transitionStatus(entry.id, 'APPROVED', adminActor);
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedByUserId).toBe('admin-user-888');

    // 2. APPROVED -> PAYABLE
    const payable = await ledgerService.transitionStatus(entry.id, 'PAYABLE', adminActor);
    expect(payable.status).toBe('PAYABLE');

    // 3. PAYABLE -> PAID
    const paid = await ledgerService.transitionStatus(entry.id, 'PAID', adminActor, undefined, 'PAY-BATCH-2026-001');
    expect(paid.status).toBe('PAID');
    expect(paid.payoutReference).toBe('PAY-BATCH-2026-001');
  });

  it('should STRICTLY reject prohibited transitions (e.g. PENDING directly to PAID)', async () => {
    const entry = await ledgerService.createLedgerEntry({
      applicationId: 'app-2',
      beneficiaryUserId: 'beneficiary-user-999',
      beneficiaryRole: 'AGENT',
      ruleId: 'rule-1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 100000,
    });

    const adminActor = { id: 'admin-user-888', role: 'ADMIN' };

    await expect(ledgerService.transitionStatus(entry.id, 'PAID', adminActor)).rejects.toThrow(
      'Prohibited ledger transition: Cannot change status from [PENDING] to [PAID]'
    );
  });

  it('should ENFORCE Separation of Duties: Beneficiary CANNOT approve or payout their own commission', async () => {
    const beneficiaryId = 'beneficiary-user-999';
    const entry = await ledgerService.createLedgerEntry({
      applicationId: 'app-3',
      beneficiaryUserId: beneficiaryId,
      beneficiaryRole: 'AGENT',
      ruleId: 'rule-1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 200000,
    });

    // Actor is the beneficiary attempting self-approval
    const selfActor = { id: beneficiaryId, role: 'AGENT' };

    await expect(ledgerService.transitionStatus(entry.id, 'APPROVED', selfActor)).rejects.toThrow(
      'Separation of duties violation: Beneficiary cannot approve or process their own commission payout'
    );
  });

  it('should create linked negative adjustment entry on REVERSED or CLAWBACK transitions', async () => {
    const entry = await ledgerService.createLedgerEntry({
      applicationId: 'app-4',
      beneficiaryUserId: 'beneficiary-user-999',
      beneficiaryRole: 'AGENT',
      ruleId: 'rule-1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 500000, // ₹5,000
    });

    const adminActor = { id: 'admin-user-888', role: 'ADMIN' };
    await ledgerService.transitionStatus(entry.id, 'APPROVED', adminActor);

    // APPROVED -> REVERSED with mandatory reason
    const reversed = await ledgerService.transitionStatus(entry.id, 'REVERSED', adminActor, 'Customer cancelled application post-approval');
    expect(reversed.status).toBe('REVERSED');

    // Verify linked adjustment entry was created
    const entries = await ledgerService.getLedgerEntries({ applicationId: 'app-4' });
    expect(entries.length).toBe(2);

    const adjustmentEntry = entries.find(e => e.originalLedgerId === entry.id);
    expect(adjustmentEntry).toBeDefined();
    expect(adjustmentEntry?.calculatedAmountPaise).toBe(-500000); // Negative adjustment
    expect(adjustmentEntry?.reversalReason).toBe('Customer cancelled application post-approval');
  });

  it('should return existing ledger entry when idempotency key matches on duplicate calls', async () => {
    const idempotencyKey = 'APP-2026-001-BENEFICIARY-1-V1';

    const entry1 = await ledgerService.createLedgerEntry({
      applicationId: 'app-5',
      beneficiaryUserId: 'user-1',
      beneficiaryRole: 'AGENT',
      ruleId: 'r1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 100000,
      idempotencyKey,
    });

    // Duplicate call with exact same idempotency key
    const entry2 = await ledgerService.createLedgerEntry({
      applicationId: 'app-5',
      beneficiaryUserId: 'user-1',
      beneficiaryRole: 'AGENT',
      ruleId: 'r1',
      ruleVersionSnapshot: 1,
      calculatedAmountPaise: 100000,
      idempotencyKey,
    });

    expect(entry1.id).toBe(entry2.id); // Deduplicated
  });
});
