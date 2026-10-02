export type CalculationType = 'FIXED' | 'PERCENTAGE' | 'SLAB';
export type FeeType = 'PROCESSING_FEE' | 'DOCUMENTATION_FEE' | 'CONVENIENCE_FEE' | 'PLATFORM_FEE' | 'PARTNER_FEE';

export interface PricingSlab {
  minAmountPaise: number;
  maxAmountPaise: number;
  value: number; // Amount in paise if FIXED, or basis points (bps, 100 = 1%) if PERCENTAGE
  type: CalculationType;
}

export interface FeeTaxRule {
  id?: string;
  taxCode: 'GST' | 'CGST' | 'SGST' | 'IGST';
  taxRateBps: number; // e.g., 1800 = 18.00%
  isInclusive: boolean;
}

export interface PricingRule {
  id: string;
  productId: string;
  version: number;
  ruleCode: string;
  name: string;
  feeType: FeeType;
  calculationType: CalculationType;
  fixedAmountPaise?: number;
  percentageBps?: number; // 250 = 2.5%
  slabs?: PricingSlab[];
  minAmountPaise?: number;
  maxAmountPaise?: number;
  taxes?: FeeTaxRule[];
  effectiveFrom: string;
  effectiveTo?: string;
  isPublished: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingFeeItemResult {
  feeType: FeeType;
  name: string;
  calculationType: CalculationType;
  baseAmountPaise: number;
  feeAmountPaise: number;
  taxAmountPaise: number;
  totalFeeWithTaxPaise: number;
  appliedTaxRateBps?: number;
  isTaxInclusive: boolean;
}

export interface PricingCalculationResult {
  productId: string;
  productVersionSnapshot: number;
  inputLoanAmountPaise: number;
  feeBreakdown: PricingFeeItemResult[];
  totalBaseFeesPaise: number;
  totalTaxesPaise: number;
  totalCustomerPayablePaise: number;
  netDisbursalAmountPaise: number;
  calculatedAt: string;
}

// Utility conversion helpers
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function bpsToPercentage(bps: number): number {
  return bps / 100;
}
