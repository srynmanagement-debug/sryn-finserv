import { DatabaseConnection } from '../../database/connection';
import { PricingRule } from '@sryn/types';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error';

const memoryPricingRules: Map<string, PricingRule> = new Map();

export class PricingService {
  public async getPricingRulesByProductId(productId: string): Promise<PricingRule[]> {
    return Array.from(memoryPricingRules.values()).filter(r => r.productId === productId);
  }

  public async createPricingRule(data: Partial<PricingRule>): Promise<PricingRule> {
    if (!data.productId || !data.ruleCode || !data.name || !data.feeType || !data.calculationType) {
      throw new BadRequestError('productId, ruleCode, name, feeType, and calculationType are required');
    }

    const id = `pric-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const rule: PricingRule = {
      id,
      productId: data.productId,
      version: 1,
      ruleCode: data.ruleCode,
      name: data.name,
      feeType: data.feeType,
      calculationType: data.calculationType,
      fixedAmountPaise: data.fixedAmountPaise || 0,
      percentageBps: data.percentageBps || 0,
      slabs: data.slabs || [],
      minAmountPaise: data.minAmountPaise || 0,
      maxAmountPaise: data.maxAmountPaise,
      taxes: data.taxes || [],
      effectiveFrom: data.effectiveFrom || now,
      effectiveTo: data.effectiveTo,
      isPublished: false,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    memoryPricingRules.set(id, rule);
    return rule;
  }

  public async publishPricingRule(id: string): Promise<PricingRule> {
    const rule = memoryPricingRules.get(id);
    if (!rule) {
      throw new NotFoundError(`Pricing rule not found: ${id}`);
    }
    rule.isPublished = true;
    rule.status = 'ACTIVE';
    rule.updatedAt = new Date().toISOString();
    memoryPricingRules.set(id, rule);
    return rule;
  }
}
