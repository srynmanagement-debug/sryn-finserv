export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'RESUBMITTED'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_VERIFICATION'
  | 'PARTNER_PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED';

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  s3Key: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedByUserId: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  previousStatus?: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedByUserId: string;
  notes?: string;
  createdAt: string;
}

export interface FinServApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  agentId?: string;
  retailerId?: string;
  productId: string;
  productVersionSnapshot: number;
  pricingRuleSnapshot: any;
  commissionRuleSnapshot: any;
  formData: Record<string, any>;
  documents: ApplicationDocument[];
  statusHistory?: ApplicationStatusHistory[];
  currentStatus: ApplicationStatus;
  currentStep: number;
  submissionIdempotencyKey?: string;
  additionalInfoRequestedNotes?: string;
  resubmittedAt?: string;
  assignedManagerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDraftRequest {
  productId: string;
  formData: Record<string, any>;
  currentStep: number;
  applicationId?: string;
}

export interface SubmitApplicationRequest {
  applicationId: string;
  submissionIdempotencyKey: string;
  formData: Record<string, any>;
}

export interface ResubmitApplicationRequest {
  applicationId: string;
  formData: Record<string, any>;
  additionalNotes?: string;
}

export interface GeneratePresignedUrlRequest {
  applicationId: string;
  documentType: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface GeneratePresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresInSeconds: number;
}

export interface RegisterDocumentRequest {
  applicationId: string;
  documentType: string;
  s3Key: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}
