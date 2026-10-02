import { CommissionRule } from '@sryn/types';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error';

const memoryCommissionRules: Map<string, CommissionRule> = new Map();

export class CommissionsService {
  public async getCommissionRulesByProductId(productId: string): Promise<CommissionRule[]> {
    return Array.from(memoryCommissionRules.values()).filter(r => r.productId === productId);
  }

  public async createCommissionRule(data: Partial<CommissionRule>): Promise<CommissionRule> {
    if (!data.productId || !data.targetRole || !data.ruleCode || !data.name || !data.calculationType) {
      throw new BadRequestError('productId, targetRole, ruleCode, name, and calculationType are required');
    }

    const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const rule: CommissionRule = {
      id,
      productId: data.productId,
      version: 1,
      targetRole: data.targetRole,
      ruleCode: data.ruleCode,
      name: data.name,
      calculationType: data.calculationType,
      fixedAmountPaise: data.fixedAmountPaise || 0,
      percentageBps: data.percentageBps || 0,
      slabs: data.slabs || [],
      channelFilter: data.channelFilter || [],
      locationFilter: data.locationFilter || [],
      minTargetThresholdPaise: data.minTargetThresholdPaise || 0,
      maxAllocationCapPaise: data.maxAllocationCapPaise,
      effectiveFrom: data.effectiveFrom || now,
      effectiveTo: data.effectiveTo,
      isPublished: false,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    memoryCommissionRules.set(id, rule);
    return rule;
  }

  public async publishCommissionRule(id: string): Promise<CommissionRule> {
    const rule = memoryCommissionRules.get(id);
    if (!rule) {
      throw new NotFoundError(`Commission rule not found: ${id}`);
    }
    rule.isPublished = true;
    rule.status = 'ACTIVE';
    rule.updatedAt = new Date().toISOString();
    memoryCommissionRules.set(id, rule);
    return rule;
  }
}
