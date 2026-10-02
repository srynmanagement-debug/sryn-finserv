import { DatabaseConnection } from '../../database/connection';
import { CommissionLedgerEntry, LedgerStatus, UserRole } from '@sryn/types';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

const memoryLedgerEntries: Map<string, CommissionLedgerEntry> = new Map();
const memoryIdempotencyKeys: Map<string, CommissionLedgerEntry> = new Map();

export class LedgerService {
  private db = DatabaseConnection.getInstance();

  public async createLedgerEntry(data: {
    applicationId: string;
    beneficiaryUserId: string;
    beneficiaryRole: UserRole;
    ruleId: string;
    ruleVersionSnapshot: number;
    calculatedAmountPaise: number;
    idempotencyKey?: string;
    currency?: string;
    referenceNotes?: string;
  }): Promise<CommissionLedgerEntry> {
    if (data.idempotencyKey && memoryIdempotencyKeys.has(data.idempotencyKey)) {
      logger.info(`[LedgerService] Idempotency key match: ${data.idempotencyKey}. Returning existing ledger entry.`);
      return memoryIdempotencyKeys.get(data.idempotencyKey)!;
    }

    const id = `ledg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const entry: CommissionLedgerEntry = {
      id,
      applicationId: data.applicationId,
      beneficiaryUserId: data.beneficiaryUserId,
      beneficiaryRole: data.beneficiaryRole,
      ruleId: data.ruleId,
      ruleVersionSnapshot: data.ruleVersionSnapshot,
      calculatedAmountPaise: data.calculatedAmountPaise,
      currency: data.currency || 'INR',
      status: 'PENDING',
      idempotencyKey: data.idempotencyKey,
      referenceNotes: data.referenceNotes,
      createdAt: now,
      updatedAt: now,
    };

    memoryLedgerEntries.set(id, entry);
    if (data.idempotencyKey) {
      memoryIdempotencyKeys.set(data.idempotencyKey, entry);
    }

    return entry;
  }

  public async getLedgerEntries(filter: {
    beneficiaryUserId?: string;
    applicationId?: string;
    status?: LedgerStatus;
  }): Promise<CommissionLedgerEntry[]> {
    let entries = Array.from(memoryLedgerEntries.values());
    if (filter.beneficiaryUserId) {
      entries = entries.filter(e => e.beneficiaryUserId === filter.beneficiaryUserId);
    }
    if (filter.applicationId) {
      entries = entries.filter(e => e.applicationId === filter.applicationId);
    }
    if (filter.status) {
      entries = entries.filter(e => e.status === filter.status);
    }
    return entries;
  }

  public async getLedgerEntryById(id: string): Promise<CommissionLedgerEntry> {
    const entry = memoryLedgerEntries.get(id);
    if (!entry) {
      throw new NotFoundError(`Ledger entry not found: ${id}`);
    }
    return entry;
  }

  public async transitionStatus(
    id: string,
    targetStatus: LedgerStatus,
    actorUser: { id: string; role: string },
    reason?: string,
    payoutReference?: string
  ): Promise<CommissionLedgerEntry> {
    const entry = await this.getLedgerEntryById(id);

    // Separation of Duties Enforcer: Beneficiary cannot approve/payout their own commission
    if (actorUser.id === entry.beneficiaryUserId && actorUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Separation of duties violation: Beneficiary cannot approve or process their own commission payout');
    }

    // State Machine Validation
    const current = entry.status;
    let isValidTransition = false;

    if (current === 'PENDING' && (targetStatus === 'APPROVED' || targetStatus === 'REJECTED')) {
      isValidTransition = true;
    } else if (current === 'APPROVED' && (targetStatus === 'PAYABLE' || targetStatus === 'REVERSED')) {
      isValidTransition = true;
    } else if (current === 'PAYABLE' && (targetStatus === 'PAID' || targetStatus === 'REVERSED')) {
      isValidTransition = true;
    } else if (current === 'PAID' && targetStatus === 'CLAWBACK') {
      isValidTransition = true;
    }

    if (!isValidTransition) {
      throw new BadRequestError(`Prohibited ledger transition: Cannot change status from [${current}] to [${targetStatus}]`);
    }

    // Handle Linked Reversals and Clawbacks
    if (targetStatus === 'REVERSED' || targetStatus === 'CLAWBACK') {
      if (!reason) {
        throw new BadRequestError(`A written reason is mandatory for financial ${targetStatus} actions`);
      }
      await this.createLinkedAdjustmentEntry(entry, targetStatus, actorUser.id, reason);
    }

    const now = new Date().toISOString();
    entry.status = targetStatus;
    entry.updatedAt = now;
    if (targetStatus === 'APPROVED') {
      entry.approvedByUserId = actorUser.id;
      entry.approvedAt = now;
    }
    if (targetStatus === 'PAID') {
      entry.paidAt = now;
      entry.payoutReference = payoutReference || `PAY-${Date.now()}`;
    }

    memoryLedgerEntries.set(id, entry);
    logger.info(`[LedgerService] Entry ${id} transitioned from ${current} -> ${targetStatus} by actor ${actorUser.id}`);
    return entry;
  }

  private async createLinkedAdjustmentEntry(
    originalEntry: CommissionLedgerEntry,
    adjustmentType: 'REVERSED' | 'CLAWBACK',
    actorUserId: string,
    reason: string
  ): Promise<CommissionLedgerEntry> {
    const id = `ledg-adj-${Date.now()}`;
    const now = new Date().toISOString();

    const adjustmentEntry: CommissionLedgerEntry = {
      id,
      applicationId: originalEntry.applicationId,
      beneficiaryUserId: originalEntry.beneficiaryUserId,
      beneficiaryRole: originalEntry.beneficiaryRole,
      ruleId: originalEntry.ruleId,
      ruleVersionSnapshot: originalEntry.ruleVersionSnapshot,
      calculatedAmountPaise: -Math.abs(originalEntry.calculatedAmountPaise), // Negative adjustment
      currency: originalEntry.currency,
      status: adjustmentType,
      originalLedgerId: originalEntry.id,
      reversalReason: reason,
      approvedByUserId: actorUserId,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    memoryLedgerEntries.set(id, adjustmentEntry);
    return adjustmentEntry;
  }
}
