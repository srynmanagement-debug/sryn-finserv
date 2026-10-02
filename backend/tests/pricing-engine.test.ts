import { calculatePricing } from '../src/modules/pricing/pricing.engine';
import { PricingRule } from '@sryn/types';

describe('Monetary Precision & Pricing Calculation Engine', () => {
  it('should calculate percentage fee and GST tax with exact integer minor units (paise) precision', () => {
    const rules: PricingRule[] = [
      {
        id: 'p1',
        productId: 'prod-123',
        version: 1,
        ruleCode: 'PF_2_PERCENT',
        name: 'Processing Fee 2%',
        feeType: 'PROCESSING_FEE',
        calculationType: 'PERCENTAGE',
        percentageBps: 200, // 2.00%
        taxes: [
          { taxCode: 'GST', taxRateBps: 1800, isInclusive: false }, // 18% Exclusive GST
        ],
        isPublished: true,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01',
      },
    ];

    const inputLoanAmountPaise = 50000000; // ₹5,00,000.00
    const result = calculatePricing(rules, inputLoanAmountPaise);

    // 2% of ₹5,00,000 = ₹10,000.00 (1000000 paise)
    expect(result.totalBaseFeesPaise).toBe(1000000);

    // 18% GST on ₹10,000 = ₹1,800.00 (180000 paise)
    expect(result.totalTaxesPaise).toBe(180000);

    // Total Customer Payable = ₹11,800.00 (1180000 paise)
    expect(result.totalCustomerPayablePaise).toBe(1180000);

    // Net Disbursal = ₹5,00,000 - ₹11,800 = ₹4,88,200.00 (48820000 paise)
    expect(result.netDisbursalAmountPaise).toBe(48820000);
  });

  it('should enforce min and max fee amount limits', () => {
    const rules: PricingRule[] = [
      {
        id: 'p2',
        productId: 'prod-123',
        version: 1,
        ruleCode: 'PF_LIMITED',
        name: 'Limited Fee',
        feeType: 'PROCESSING_FEE',
        calculationType: 'PERCENTAGE',
        percentageBps: 500, // 5%
        minAmountPaise: 100000, // Min ₹1,000
        maxAmountPaise: 250000, // Max ₹2,500
        isPublished: true,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01',
      },
    ];

    // On ₹1,00,000, 5% is ₹5,000, but capped at Max ₹2,500 (250000 paise)
    const resultHigh = calculatePricing(rules, 10000000);
    expect(resultHigh.totalBaseFeesPaise).toBe(250000);

    // On ₹10,000, 5% is ₹500, but raised to Min ₹1,000 (100000 paise)
    const resultLow = calculatePricing(rules, 1000000);
    expect(resultLow.totalBaseFeesPaise).toBe(100000);
  });
});
