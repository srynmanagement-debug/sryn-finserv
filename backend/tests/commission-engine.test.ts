import { calculateCommissionTree } from '../src/modules/commissions/commission.engine';
import { CommissionRule } from '@sryn/types';

describe('Multi-Tier Commission Attribution Engine', () => {
  const rules: CommissionRule[] = [
    {
      id: 'c1',
      productId: 'prod-100',
      version: 1,
      targetRole: 'AGENT',
      ruleCode: 'AGENT_COMM',
      name: 'Agent Commission 1.5%',
      calculationType: 'PERCENTAGE',
      percentageBps: 150, // 1.50%
      isPublished: true,
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01',
    },
    {
      id: 'c2',
      productId: 'prod-100',
      version: 1,
      targetRole: 'RETAILER',
      ruleCode: 'RETAILER_COMM',
      name: 'Retailer Commission 1.0%',
      calculationType: 'PERCENTAGE',
      percentageBps: 100, // 1.00%
      isPublished: true,
      status: 'ACTIVE',
      effectiveFrom: '2026-01-01',
    },
  ];

  const beneficiaries = [
    { userId: 'user-agent-1', role: 'AGENT' as const },
    { userId: 'user-retailer-1', role: 'RETAILER' as const },
  ];

  it('should calculate multi-tier attributions correctly for present roles', () => {
    const disbursalAmountPaise = 20000000; // ₹2,00,000.00
    const result = calculateCommissionTree(rules, disbursalAmountPaise, beneficiaries);

    expect(result.attributions).toHaveLength(2);

    // Agent: 1.5% of ₹2,00,000 = ₹3,000 (300000 paise)
    const agentAttr = result.attributions.find(a => a.beneficiaryRole === 'AGENT');
    expect(agentAttr?.calculatedAmountPaise).toBe(300000);

    // Retailer: 1% of ₹2,00,000 = ₹2,000 (200000 paise)
    const retailerAttr = result.attributions.find(a => a.beneficiaryRole === 'RETAILER');
    expect(retailerAttr?.calculatedAmountPaise).toBe(200000);

    expect(result.totalCommissionAllocatedPaise).toBe(500000); // ₹5,000 total
  });

  it('should apply maximum allocation caps when rule caps are specified', () => {
    const cappedRules: CommissionRule[] = [
      {
        id: 'c3',
        productId: 'prod-100',
        version: 1,
        targetRole: 'AGENT',
        ruleCode: 'AGENT_CAPPED',
        name: 'Agent Capped',
        calculationType: 'PERCENTAGE',
        percentageBps: 500, // 5%
        maxAllocationCapPaise: 150000, // Capped at ₹1,500
        isPublished: true,
        status: 'ACTIVE',
        effectiveFrom: '2026-01-01',
      },
    ];

    const result = calculateCommissionTree(cappedRules, 10000000, beneficiaries); // 5% of ₹1L is ₹5,000
    expect(result.attributions[0].calculatedAmountPaise).toBe(150000); // Capped at ₹1,500
    expect(result.attributions[0].capApplied).toBe(true);
  });
});
