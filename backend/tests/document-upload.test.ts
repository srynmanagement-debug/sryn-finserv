import { generatePresignedUrlSchema, registerDocumentSchema } from '@sryn/validation';

describe('Document Upload & Presigned URL Validation', () => {
  it('should validate valid document upload presigned URL request parameters', () => {
    const validData = {
      applicationId: '00000000-0000-0000-0000-000000000001',
      documentType: 'PAN_CARD',
      fileName: 'pan_card_front.pdf',
      fileSizeBytes: 2048576, // 2MB
      mimeType: 'application/pdf',
    };

    const parsed = generatePresignedUrlSchema.parse(validData);
    expect(parsed.documentType).toBe('PAN_CARD');
    expect(parsed.mimeType).toBe('application/pdf');
  });

  it('should reject document upload requests exceeding max allowed 10MB size limit', () => {
    const oversizedData = {
      applicationId: '00000000-0000-0000-0000-000000000001',
      documentType: 'INCOME_PROOF',
      fileName: 'bank_statement_large.pdf',
      fileSizeBytes: 15728640, // 15MB (> 10MB limit)
      mimeType: 'application/pdf',
    };

    expect(() => {
      generatePresignedUrlSchema.parse(oversizedData);
    }).toThrow();
  });

  it('should reject unpermitted file MIME types', () => {
    const invalidMimeData = {
      applicationId: '00000000-0000-0000-0000-000000000001',
      documentType: 'IDENTITY_PROOF',
      fileName: 'document.exe',
      fileSizeBytes: 1024,
      mimeType: 'application/x-msdownload',
    };

    expect(() => {
      generatePresignedUrlSchema.parse(invalidMimeData);
    }).toThrow();
  });

  it('should validate register document schema correctly', () => {
    const registerData = {
      applicationId: '00000000-0000-0000-0000-000000000001',
      documentType: 'AADHAAR_CARD',
      s3Key: 'applications/00000000-0000-0000-0000-000000000001/AADHAAR_CARD/12345_aadhaar.png',
      fileName: 'aadhaar.png',
      fileSizeBytes: 512000,
      mimeType: 'image/png',
    };

    const parsed = registerDocumentSchema.parse(registerData);
    expect(parsed.s3Key).toContain('applications/');
    expect(parsed.mimeType).toBe('image/png');
  });
});
