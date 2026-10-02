import { FormSchemaConfig, FormFieldConfig } from '@sryn/types';
import { BadRequestError, NotFoundError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

const ALLOWED_FIELD_TYPES = new Set([
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

const ALLOWED_CONDITION_OPERATORS = new Set([
  'EQUALS',
  'NOT_EQUALS',
  'IN',
  'IS_NOT_EMPTY',
]);

const memoryFormSchemas: Map<string, FormSchemaConfig> = new Map();

export class FormsService {
  public validateSchema(schema: FormSchemaConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema.productId) {
      errors.push('productId is required');
    }
    if (!schema.steps || !Array.isArray(schema.steps) || schema.steps.length === 0) {
      errors.push('Form schema must contain at least one step');
      return { isValid: false, errors };
    }

    const seenFieldNames = new Set<string>();

    schema.steps.forEach((step, stepIndex) => {
      if (!step.title) {
        errors.push(`Step ${stepIndex + 1} must have a title`);
      }
      if (!step.fields || !Array.isArray(step.fields)) {
        errors.push(`Step ${stepIndex + 1} must have a fields array`);
        return;
      }

      step.fields.forEach((field, fieldIndex) => {
        if (!field.name || !/^[a-zA-Z0-9_]+$/.test(field.name)) {
          errors.push(`Step ${stepIndex + 1} field ${fieldIndex + 1} has invalid name [${field.name}]. Must be alphanumeric.`);
        } else if (seenFieldNames.has(field.name)) {
          errors.push(`Duplicate field name detected: ${field.name}`);
        } else {
          seenFieldNames.add(field.name);
        }

        if (!field.fieldType || !ALLOWED_FIELD_TYPES.has(field.fieldType)) {
          errors.push(`Field [${field.name}] has unsupported fieldType: ${field.fieldType}`);
        }

        if (field.condition) {
          if (!field.condition.dependsOnField) {
            errors.push(`Field [${field.name}] condition missing dependsOnField`);
          }
          if (!ALLOWED_CONDITION_OPERATORS.has(field.condition.operator)) {
            errors.push(`Field [${field.name}] condition has invalid operator: ${field.condition.operator}`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public async getFormSchemaByProductId(productId: string): Promise<FormSchemaConfig> {
    const schema = memoryFormSchemas.get(productId);
    if (!schema) {
      // Return default starter schema for new products
      return {
        id: `form-${productId}`,
        productId,
        version: 1,
        title: 'Application Form',
        steps: [
          {
            stepNumber: 1,
            title: 'Personal Details',
            fields: [
              {
                id: 'f1',
                name: 'fullName',
                label: 'Full Name',
                fieldType: 'TEXT',
                placeholder: 'Enter your full name',
                validations: [{ type: 'REQUIRED', message: 'Full name is required' }],
                isReadonly: false,
                stepNumber: 1,
                displayOrder: 1,
              },
              {
                id: 'f2',
                name: 'monthlyIncome',
                label: 'Monthly Income (₹)',
                fieldType: 'NUMBER',
                placeholder: 'e.g. 50000',
                validations: [
                  { type: 'REQUIRED', message: 'Monthly income is required' },
                  { type: 'MIN_VALUE', value: 10000, message: 'Minimum monthly income is ₹10,000' },
                ],
                isReadonly: false,
                stepNumber: 1,
                displayOrder: 2,
              },
            ],
          },
        ],
      };
    }
    return schema;
  }

  public async saveFormSchema(schema: FormSchemaConfig): Promise<FormSchemaConfig> {
    const validation = this.validateSchema(schema);
    if (!validation.isValid) {
      throw new BadRequestError(`Invalid form schema: ${validation.errors.join('; ')}`);
    }

    const existing = memoryFormSchemas.get(schema.productId);
    const newVersion = existing ? existing.version + 1 : 1;

    const saved: FormSchemaConfig = {
      ...schema,
      id: schema.id || `form-${schema.productId}`,
      version: newVersion,
    };

    memoryFormSchemas.set(schema.productId, saved);
    logger.info(`Form schema saved for product ${schema.productId} [v${newVersion}]`);
    return saved;
  }
}
