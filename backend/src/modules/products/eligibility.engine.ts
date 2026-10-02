import { ProductEligibilityRule } from '@sryn/types';

export interface EligibilityEvaluationResult {
  isEligible: boolean;
  failedRules: string[];
  reasons: string[];
  isPreliminary: boolean;
  evaluatedAt: string;
}

export function evaluateEligibility(
  rules: ProductEligibilityRule[],
  applicantData: Record<string, any>
): EligibilityEvaluationResult {
  const failedRules: string[] = [];
  const reasons: string[] = [];

  for (const rule of rules) {
    const actualValue = applicantData[rule.fieldName];

    if (actualValue === undefined || actualValue === null) {
      failedRules.push(rule.ruleCode);
      reasons.push(rule.errorMessage || `Missing required field: ${rule.fieldName}`);
      continue;
    }

    let passes = false;

    switch (rule.operator) {
      case 'EQUALS':
        passes = actualValue === rule.expectedValue;
        break;
      case 'NOT_EQUALS':
        passes = actualValue !== rule.expectedValue;
        break;
      case 'GREATER_THAN':
        passes = Number(actualValue) > Number(rule.expectedValue);
        break;
      case 'LESS_THAN':
        passes = Number(actualValue) < Number(rule.expectedValue);
        break;
      case 'IN':
        if (Array.isArray(rule.expectedValue)) {
          passes = rule.expectedValue.includes(actualValue);
        }
        break;
      case 'BETWEEN':
        if (Array.isArray(rule.expectedValue) && rule.expectedValue.length >= 2) {
          const num = Number(actualValue);
          passes = num >= Number(rule.expectedValue[0]) && num <= Number(rule.expectedValue[1]);
        }
        break;
      default:
        passes = false;
    }

    if (!passes) {
      failedRules.push(rule.ruleCode);
      reasons.push(rule.errorMessage || `Field ${rule.fieldName} failed condition ${rule.operator}`);
    }
  }

  return {
    isEligible: failedRules.length === 0,
    failedRules,
    reasons,
    isPreliminary: true, // Preliminary automated rules result; lender final approval pending
    evaluatedAt: new Date().toISOString(),
  };
}
