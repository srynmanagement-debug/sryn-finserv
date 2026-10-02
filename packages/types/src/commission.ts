import { UserRole } from './user';
import { CalculationType, PricingSlab } from './pricing';

export interface CommissionRule {
  id: string;
  productId: string;
  version: number;
  targetRole: UserRole;
  ruleCode: string;
  name: string;
  calculationType: CalculationType;
  fixedAmountPaise?: number;
  percentageBps?: number;
  slabs?: PricingSlab[];
  channelFilter?: string[];
  locationFilter?: string[];
  minTargetThresholdPaise?: number;
  maxAllocationCapPaise?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isPublished: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CommissionAttributionItem {
  beneficiaryUserId: string;
  beneficiaryRole: UserRole;
  ruleId: string;
  ruleVersion: number;
  calculationBasisPaise: number;
  calculatedAmountPaise: number;
  capApplied: boolean;
  notes?: string;
}

export interface CommissionTreeCalculationResult {
  productId: string;
  applicationId: string;
  disbursalAmountPaise: number;
  attributions: CommissionAttributionItem[];
  totalCommissionAllocatedPaise: number;
  maxPermittedAllocationPaise: number;
  calculatedAt: string;
}
