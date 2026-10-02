export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSubcategory {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductEligibilityRule {
  id?: string;
  ruleCode: string;
  fieldName: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'BETWEEN';
  expectedValue?: any;
  errorMessage: string;
}

export interface DocumentRequirement {
  id?: string;
  documentType: string;
  title: string;
  isRequired: boolean;
  maxSizeMb: number;
  allowedExtensions: string[];
}

export interface BankingPartner {
  id: string;
  code: string;
  name: string;
  logoUrl?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPartnerMapping {
  productId: string;
  partnerId: string;
  isPrimary: boolean;
  revenueSharePercentage?: number;
  partner?: BankingPartner;
}

export interface ProductConfig {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  partnerId?: string;
  partners?: ProductPartnerMapping[];
  status: ProductStatus;
  version: number;
  description?: string;
  iconUrl?: string;
  eligibilityRules: ProductEligibilityRule[];
  documentRequirements: DocumentRequirement[];
  workflowId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVersionRecord {
  id: string;
  productId: string;
  version: number;
  configSnapshot: ProductConfig;
  createdBy?: string;
  createdAt: string;
}
