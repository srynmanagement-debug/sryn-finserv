import { z } from 'zod';

export const fieldTypeEnum = z.enum([
  'TEXT',
  'NUMBER',
  'EMAIL',
  'PHONE',
  'DATE',
  'DROPDOWN',
  'MULTI_SELECT',
  'RADIO',
  'CHECKBOX',
  'FILE_UPLOAD',
  'CAMERA_CAPTURE',
]);

export const optionItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const fieldValidationRuleSchema = z.object({
  type: z.enum(['REQUIRED', 'REGEX', 'MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE']),
  value: z.any().optional(),
  message: z.string().min(1),
});

export const fieldConditionSchema = z.object({
  dependsOnField: z.string().min(1),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'IS_NOT_EMPTY']),
  value: z.any().optional(),
});

export const formFieldConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).regex(/^[a-zA-Z0-9_]+$/, 'Field name must be alphanumeric identifier'),
  label: z.string().min(1),
  fieldType: fieldTypeEnum,
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(optionItemSchema).optional(),
  validations: z.array(fieldValidationRuleSchema).default([]),
  condition: fieldConditionSchema.optional(),
  isReadonly: z.boolean().default(false),
  stepNumber: z.number().int().positive().default(1),
  displayOrder: z.number().int().default(0),
});

export const formStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  fields: z.array(formFieldConfigSchema),
});

export const saveFormSchemaSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(1),
  steps: z.array(formStepSchema).min(1, 'Form schema must contain at least one step'),
});
