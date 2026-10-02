import { evaluateEligibility } from '../src/modules/products/eligibility.engine';
import { ProductEligibilityRule } from '@sryn/types';

describe('Deterministic Eligibility Rules Evaluation Engine', () => {
  const rules: ProductEligibilityRule[] = [
    {
      id: 'r1',
      ruleCode: 'MIN_INCOME',
      fieldName: 'monthlyIncome',
      operator: 'GREATER_THAN',
      expectedValue: 25000,
      errorMessage: 'Monthly income must be greater than ₹25,000',
    },
    {
      id: 'r2',
      ruleCode: 'ALLOWED_CITY',
      fieldName: 'city',
      operator: 'IN',
      expectedValue: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'],
      errorMessage: 'Serviceable in tier-1 metro cities only',
    },
    {
      id: 'r3',
      ruleCode: 'CREDIT_SCORE_RANGE',
      fieldName: 'cibilScore',
      operator: 'BETWEEN',
      expectedValue: [700, 900],
      errorMessage: 'CIBIL score must be between 700 and 900',
    },
  ];

  it('should return isEligible = true when applicant satisfies all rules', () => {
    const applicantData = {
      monthlyIncome: 50000,
      city: 'Mumbai',
      cibilScore: 750,
    };

    const result = evaluateEligibility(rules, applicantData);
    expect(result.isEligible).toBe(true);
    expect(result.failedRules).toHaveLength(0);
    expect(result.reasons).toHaveLength(0);
    expect(result.isPreliminary).toBe(true);
  });

  it('should return isEligible = false with explainable reasons when applicant fails rules', () => {
    const applicantData = {
      monthlyIncome: 18000, // Fails MIN_INCOME
      city: 'Pune',          // Fails ALLOWED_CITY
      cibilScore: 650,       // Fails CREDIT_SCORE_RANGE
    };

    const result = evaluateEligibility(rules, applicantData);
    expect(result.isEligible).toBe(false);
    expect(result.failedRules).toEqual(['MIN_INCOME', 'ALLOWED_CITY', 'CREDIT_SCORE_RANGE']);
    expect(result.reasons).toHaveLength(3);
    expect(result.reasons[0]).toBe('Monthly income must be greater than ₹25,000');
  });

  it('should fail when required fields are missing from applicant data', () => {
    const incompleteApplicant = {
      monthlyIncome: 50000,
      // Missing city & cibilScore
    };

    const result = evaluateEligibility(rules, incompleteApplicant);
    expect(result.isEligible).toBe(false);
    expect(result.failedRules).toContain('ALLOWED_CITY');
    expect(result.failedRules).toContain('CREDIT_SCORE_RANGE');
  });
});
