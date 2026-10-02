import { CommissionRule, CommissionTreeCalculationResult, CommissionAttributionItem, UserRole } from '@sryn/types';

export function calculateCommissionTree(
  rules: CommissionRule[],
  disbursalAmountPaise: number,
  beneficiaries: { userId: string; role: UserRole }[]
): CommissionTreeCalculationResult {
  const attributions: CommissionAttributionItem[] = [];
  let totalAllocatedPaise = 0;
  const maxPermittedAllocationPaise = Math.round(disbursalAmountPaise * 0.10); // Default 10% maximum allocation cap

  // Map beneficiaries by role
  const beneficiaryMap = new Map<UserRole, string>();
  for (const b of beneficiaries) {
    beneficiaryMap.set(b.role, b.userId);
  }

  for (const rule of rules) {
    if (rule.status === 'ARCHIVED') continue;

    const beneficiaryUserId = beneficiaryMap.get(rule.targetRole);
    if (!beneficiaryUserId) continue; // Beneficiary role not present in attribution chain

    // Check minimum target threshold
    if (rule.minTargetThresholdPaise && disbursalAmountPaise < rule.minTargetThresholdPaise) {
      continue;
    }

    let calculatedAmountPaise = 0;

    if (rule.calculationType === 'FIXED') {
      calculatedAmountPaise = rule.fixedAmountPaise || 0;
    } else if (rule.calculationType === 'PERCENTAGE') {
      const bps = rule.percentageBps || 0;
      calculatedAmountPaise = Math.round((disbursalAmountPaise * bps) / 10000);
    } else if (rule.calculationType === 'SLAB' && rule.slabs) {
      for (const slab of rule.slabs) {
        if (disbursalAmountPaise >= slab.minAmountPaise && disbursalAmountPaise <= slab.maxAmountPaise) {
          if (slab.type === 'FIXED') {
            calculatedAmountPaise = slab.value;
          } else {
            calculatedAmountPaise = Math.round((disbursalAmountPaise * slab.value) / 10000);
          }
          break;
        }
      }
    }

    let capApplied = false;
    if (rule.maxAllocationCapPaise && calculatedAmountPaise > rule.maxAllocationCapPaise) {
      calculatedAmountPaise = rule.maxAllocationCapPaise;
      capApplied = true;
    }

    totalAllocatedPaise += calculatedAmountPaise;

    attributions.push({
      beneficiaryUserId,
      beneficiaryRole: rule.targetRole,
      ruleId: rule.id,
      ruleVersion: rule.version,
      calculationBasisPaise: disbursalAmountPaise,
      calculatedAmountPaise,
      capApplied,
      notes: `Commission calculated via rule ${rule.ruleCode} (${rule.calculationType})`,
    });
  }

  return {
    productId: rules[0]?.productId || '',
    applicationId: 'PREVIEW',
    disbursalAmountPaise,
    attributions,
    totalCommissionAllocatedPaise: totalAllocatedPaise,
    maxPermittedAllocationPaise,
    calculatedAt: new Date().toISOString(),
  };
}
