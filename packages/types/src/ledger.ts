import { UserRole } from './user';

export type LedgerStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PAYABLE'
  | 'PAID'
  | 'REJECTED'
  | 'REVERSED'
  | 'CLAWBACK';

export interface CommissionLedgerEntry {
  id: string;
  applicationId: string;
  beneficiaryUserId: string;
  beneficiaryRole: UserRole;
  ruleId: string;
  ruleVersionSnapshot: number;
  calculatedAmountPaise: number;
  currency: string;
  status: LedgerStatus;
  idempotencyKey?: string;
  originalLedgerId?: string;
  reversalReason?: string;
  approvedByUserId?: string;
  approvedAt?: string;
  paidAt?: string;
  payoutBatchId?: string;
  payoutReference?: string;
  referenceNotes?: string;
  createdAt: string;
  updatedAt: string;
}
