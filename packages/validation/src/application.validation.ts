import { z } from 'zod';

export const createApplicationSchema = z.object({
  productId: z.string().uuid(),
  customerId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  retailerId: z.string().uuid().optional(),
  formData: z.record(z.any()),
});

export const saveDraftSchema = z.object({
  applicationId: z.string().uuid().optional(),
  productId: z.string().uuid(),
  formData: z.record(z.any()),
  currentStep: z.number().int().min(1).default(1),
});

export const submitApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  submissionIdempotencyKey: z.string().min(1).max(255),
  formData: z.record(z.any()),
});

export const resubmitApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  formData: z.record(z.any()),
  additionalNotes: z.string().max(1000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  newStatus: z.enum([
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'ADDITIONAL_INFORMATION_REQUIRED',
    'RESUBMITTED',
    'DOCUMENTS_PENDING',
    'UNDER_VERIFICATION',
    'PARTNER_PROCESSING',
    'APPROVED',
    'REJECTED',
    'DISBURSED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export const generatePresignedUrlSchema = z.object({
  applicationId: z.string().uuid(),
  documentType: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(10485760, 'File size must not exceed 10MB'),
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ]),
});

export const registerDocumentSchema = z.object({
  applicationId: z.string().uuid(),
  documentType: z.string().min(1).max(100),
  s3Key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(10485760, 'File size must not exceed 10MB'),
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
  ]),
});
