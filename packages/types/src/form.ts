export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE_UPLOAD'
  | 'CAMERA_CAPTURE';

export interface OptionItem {
  label: string;
  value: string;
}

export interface FieldValidationRule {
  type: 'REQUIRED' | 'REGEX' | 'MIN_LENGTH' | 'MAX_LENGTH' | 'MIN_VALUE' | 'MAX_VALUE';
  value?: any;
  message: string;
}

export interface FieldCondition {
  dependsOnField: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'IS_NOT_EMPTY';
  value: any;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  defaultValue?: any;
  options?: OptionItem[];
  validations: FieldValidationRule[];
  condition?: FieldCondition;
  isReadonly: boolean;
  stepNumber: number;
  displayOrder: number;
}

export interface FormSchemaConfig {
  id: string;
  productId: string;
  version: number;
  title: string;
  steps: {
    stepNumber: number;
    title: string;
    fields: FormFieldConfig[];
  }[];
}
