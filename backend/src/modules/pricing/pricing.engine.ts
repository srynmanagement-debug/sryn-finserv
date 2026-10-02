import { PricingRule, PricingCalculationResult, PricingFeeItemResult } from '@sryn/types';

export function calculatePricing(
  rules: PricingRule[],
  inputLoanAmountPaise: number
): PricingCalculationResult {
  const feeBreakdown: PricingFeeItemResult[] = [];
  let totalBaseFeesPaise = 0;
  let totalTaxesPaise = 0;

  for (const rule of rules) {
    if (rule.status === 'ARCHIVED') continue;

    let feePaise = 0;

    if (rule.calculationType === 'FIXED') {
      feePaise = rule.fixedAmountPaise || 0;
    } else if (rule.calculationType === 'PERCENTAGE') {
      const bps = rule.percentageBps || 0;
      feePaise = Math.round((inputLoanAmountPaise * bps) / 10000);
    } else if (rule.calculationType === 'SLAB' && rule.slabs) {
      for (const slab of rule.slabs) {
        if (inputLoanAmountPaise >= slab.minAmountPaise && inputLoanAmountPaise <= slab.maxAmountPaise) {
          if (slab.type === 'FIXED') {
            feePaise = slab.value;
          } else {
            feePaise = Math.round((inputLoanAmountPaise * slab.value) / 10000);
          }
          break;
        }
      }
    }

    // Apply Min / Max Fee Limits
    if (rule.minAmountPaise && feePaise < rule.minAmountPaise) {
      feePaise = rule.minAmountPaise;
    }
    if (rule.maxAmountPaise && feePaise > rule.maxAmountPaise) {
      feePaise = rule.maxAmountPaise;
    }

    // Calculate Taxes
    let taxPaise = 0;
    let appliedTaxRateBps = 0;
    let isInclusive = false;

    if (rule.taxes && rule.taxes.length > 0) {
      for (const tax of rule.taxes) {
        appliedTaxRateBps += tax.taxRateBps;
        isInclusive = tax.isInclusive;

        if (tax.isInclusive) {
          // Inclusive Tax: Tax = Fee - (Fee / (1 + Rate))
          const baseWithoutTax = Math.round((feePaise * 10000) / (10000 + tax.taxRateBps));
          taxPaise += feePaise - baseWithoutTax;
        } else {
          // Exclusive Tax: Tax = Fee * (Rate / 10000)
          taxPaise += Math.round((feePaise * tax.taxRateBps) / 10000);
        }
      }
    }

    totalBaseFeesPaise += feePaise;
    totalTaxesPaise += taxPaise;

    feeBreakdown.push({
      feeType: rule.feeType,
      name: rule.name,
      calculationType: rule.calculationType,
      baseAmountPaise: inputLoanAmountPaise,
      feeAmountPaise: feePaise,
      taxAmountPaise: taxPaise,
      totalFeeWithTaxPaise: isInclusive ? feePaise : feePaise + taxPaise,
      appliedTaxRateBps,
      isTaxInclusive: isInclusive,
    });
  }

  const totalCustomerPayablePaise = totalBaseFeesPaise + totalTaxesPaise;
  const netDisbursalAmountPaise = Math.max(0, inputLoanAmountPaise - totalCustomerPayablePaise);

  return {
    productId: rules[0]?.productId || '',
    productVersionSnapshot: rules[0]?.version || 1,
    inputLoanAmountPaise,
    feeBreakdown,
    totalBaseFeesPaise,
    totalTaxesPaise,
    totalCustomerPayablePaise,
    netDisbursalAmountPaise,
    calculatedAt: new Date().toISOString(),
  };
}
