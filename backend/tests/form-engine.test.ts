import { FormsService } from '../src/modules/forms/forms.service';
import { FormSchemaConfig } from '@sryn/types';

describe('Dynamic Form Schema Management Engine', () => {
  let formsService: FormsService;

  beforeEach(() => {
    formsService = new FormsService();
  });

  it('should validate a valid multi-step declarative form schema', () => {
    const validSchema: FormSchemaConfig = {
      id: 'form-1',
      productId: 'prod-123',
      version: 1,
      title: 'Loan Application Form',
      steps: [
        {
          stepNumber: 1,
          title: 'Personal Info',
          fields: [
            {
              id: 'f1',
              name: 'fullName',
              label: 'Full Name',
              fieldType: 'TEXT',
              validations: [{ type: 'REQUIRED', message: 'Required' }],
              isReadonly: false,
              stepNumber: 1,
              displayOrder: 1,
            },
          ],
        },
      ],
    };

    const result = formsService.validateSchema(validSchema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject schema with invalid field names or duplicate field keys', () => {
    const invalidSchema: FormSchemaConfig = {
      id: 'form-2',
      productId: 'prod-123',
      version: 1,
      title: 'Invalid Form',
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1',
          fields: [
            {
              id: 'f1',
              name: 'invalid field name with spaces!',
              label: 'Bad Field',
              fieldType: 'TEXT',
              validations: [],
              isReadonly: false,
              stepNumber: 1,
              displayOrder: 1,
            },
          ],
        },
      ],
    };

    const result = formsService.validateSchema(invalidSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid name'))).toBe(true);
  });

  it('should reject schema with unsupported field types', () => {
    const unsupportedSchema: any = {
      id: 'form-3',
      productId: 'prod-123',
      version: 1,
      title: 'Unsupported Type Form',
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1',
          fields: [
            {
              id: 'f1',
              name: 'customField',
              label: 'Custom',
              fieldType: 'EXECUTE_CUSTOM_SCRIPT', // Dangerous / unsupported type
              validations: [],
              isReadonly: false,
              stepNumber: 1,
              displayOrder: 1,
            },
          ],
        },
      ],
    };

    const result = formsService.validateSchema(unsupportedSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('unsupported fieldType'))).toBe(true);
  });
});
