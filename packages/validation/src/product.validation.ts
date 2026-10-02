import { z } from 'zod';

export const createCategorySchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Category code must be UPPERCASE_SNAKE_CASE'),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().optional().default(0),
});

export const createSubcategorySchema = z.object({
  categoryId: z.string().uuid(),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Subcategory code must be UPPERCASE_SNAKE_CASE'),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const eligibilityRuleSchema = z.object({
  id: z.string().optional(),
  ruleCode: z.string().min(2),
  fieldName: z.string().min(1),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN', 'BETWEEN']),
  expectedValue: z.any(),
  errorMessage: z.string().min(1),
});

export const documentRequirementSchema = z.object({
  id: z.string().optional(),
  documentType: z.string().min(1),
  title: z.string().min(1),
  isRequired: z.boolean().default(true),
  maxSizeMb: z.number().positive().default(5),
  allowedExtensions: z.array(z.string()).default(['pdf', 'jpg', 'png']),
});

export const createProductSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Product code must be UPPERCASE_SNAKE_CASE'),
  name: z.string().min(2).max(150),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  partnerId: z.string().uuid().optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal('')),
  eligibilityRules: z.array(eligibilityRuleSchema).optional().default([]),
  documentRequirements: z.array(documentRequirementSchema).optional().default([]),
  workflowId: z.string().optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});
