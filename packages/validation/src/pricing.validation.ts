import { z } from 'zod';

export const pricingSlabSchema = z.object({
  minAmountPaise: z.number().int().min(0),
  maxAmountPaise: z.number().int().positive(),
  value: z.number().nonnegative(),
  type: z.enum(['FIXED', 'PERCENTAGE', 'SLAB']),
});

export const feeTaxRuleSchema = z.object({
  taxCode: z.enum(['GST', 'CGST', 'SGST', 'IGST']),
  taxRateBps: z.number().int().min(0).max(10000), // e.g. 1800 = 18%
  isInclusive: z.boolean().default(false),
});

export const createPricingRuleSchema = z.object({
  productId: z.string().uuid(),
  ruleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(2).max(150),
  feeType: z.enum(['PROCESSING_FEE', 'DOCUMENTATION_FEE', 'CONVENIENCE_FEE', 'PLATFORM_FEE', 'PARTNER_FEE']),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'SLAB']),
  fixedAmountPaise: z.number().int().min(0).optional(),
  percentageBps: z.number().int().min(0).max(10000).optional(),
  slabs: z.array(pricingSlabSchema).optional(),
  minAmountPaise: z.number().int().min(0).optional(),
  maxAmountPaise: z.number().int().positive().optional(),
  taxes: z.array(feeTaxRuleSchema).optional().default([]),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

export const createCommissionRuleSchema = z.object({
  productId: z.string().uuid(),
  targetRole: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT', 'DISTRIBUTOR', 'RETAILER', 'CUSTOMER']),
  ruleCode: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(2).max(150),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'SLAB']),
  fixedAmountPaise: z.number().int().min(0).optional(),
  percentageBps: z.number().int().min(0).max(10000).optional(),
  slabs: z.array(pricingSlabSchema).optional(),
  channelFilter: z.array(z.string()).optional(),
  locationFilter: z.array(z.string()).optional(),
  minTargetThresholdPaise: z.number().int().min(0).optional(),
  maxAllocationCapPaise: z.number().int().positive().optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

export const calculatePricingPreviewSchema = z.object({
  productId: z.string().uuid(),
  loanAmountPaise: z.number().int().positive(),
});

export const calculateCommissionPreviewSchema = z.object({
  productId: z.string().uuid(),
  disbursalAmountPaise: z.number().int().positive(),
  beneficiaries: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT', 'DISTRIBUTOR', 'RETAILER', 'CUSTOMER']),
  })),
});

export const ledgerTransitionSchema = z.object({
  targetStatus: z.enum(['APPROVED', 'PAYABLE', 'PAID', 'REJECTED', 'REVERSED', 'CLAWBACK']),
  reason: z.string().optional(),
  payoutReference: z.string().optional(),
});
