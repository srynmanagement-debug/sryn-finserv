import { DatabaseConnection } from '../../database/connection';
import { ApplicationDocument } from '@sryn/types';
import { generatePresignedUrlSchema, registerDocumentSchema } from '@sryn/validation';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { AuditService } from '../audit/audit.service';

const auditService = new AuditService();

export class DocumentsService {
  private db = DatabaseConnection.getInstance();

  /**
   * Generates a pre-signed S3 upload URL (or mock presigned URL in development).
   */
  async generatePresignedUrl(
    userId: string,
    payload: {
      applicationId: string;
      documentType: string;
      fileName: string;
      fileSizeBytes: number;
      mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/jpg' | 'image/webp';
    }
  ) {
    const validated = generatePresignedUrlSchema.parse(payload);

    // Verify application exists & check ownership
    const appRes = await this.db.query(
      'SELECT id, customer_id FROM applications WHERE id = $1',
      [validated.applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new NotFoundError('Application not found');
    }

    if (appRes.rows[0].customer_id !== userId) {
      throw new ForbiddenError('Unauthorized access to application');
    }

    const sanitizedFileName = validated.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const s3Key = `applications/${validated.applicationId}/${validated.documentType}/${Date.now()}_${sanitizedFileName}`;
    const uploadUrl = `https://sryn-finserv-uploads-dev.s3.ap-south-1.amazonaws.com/${s3Key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock%2F20261002%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20261002T000000Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=mocksignature`;

    return {
      uploadUrl,
      s3Key,
      expiresInSeconds: 900,
    };
  }

  /**
   * Registers an uploaded document in the database after successful S3 upload.
   */
  async registerDocument(
    userId: string,
    payload: {
      applicationId: string;
      documentType: string;
      s3Key: string;
      fileName: string;
      fileSizeBytes: number;
      mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/jpg' | 'image/webp';
    }
  ): Promise<ApplicationDocument> {
    const validated = registerDocumentSchema.parse(payload);

    // Verify application ownership
    const appRes = await this.db.query(
      'SELECT id, customer_id FROM applications WHERE id = $1',
      [validated.applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new NotFoundError('Application not found');
    }

    if (appRes.rows[0].customer_id !== userId) {
      throw new ForbiddenError('Unauthorized access to application');
    }

    const res = await this.db.query(
      `INSERT INTO application_documents (
        application_id, document_type, s3_key, file_name, file_size_bytes, mime_type, uploaded_by_user_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_VERIFICATION')
      RETURNING *`,
      [
        validated.applicationId,
        validated.documentType,
        validated.s3Key,
        validated.fileName,
        validated.fileSizeBytes,
        validated.mimeType,
        userId,
      ]
    );

    const doc = res.rows[0];

    await auditService.logEvent({
      actorUserId: userId,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'application_documents',
      entityId: doc.id,
      metadata: {
        applicationId: validated.applicationId,
        documentType: validated.documentType,
        fileName: validated.fileName,
      },
    });

    return {
      id: doc.id,
      applicationId: doc.application_id,
      documentType: doc.document_type,
      s3Key: doc.s3_key,
      fileName: doc.file_name,
      fileSizeBytes: Number(doc.file_size_bytes),
      mimeType: doc.mime_type,
      uploadedByUserId: doc.uploaded_by_user_id,
      status: doc.status,
      rejectionReason: doc.rejection_reason || undefined,
      uploadedAt: doc.uploaded_at.toISOString(),
    };
  }

  /**
   * Retrieves all documents associated with an application.
   */
  async getApplicationDocuments(userId: string, applicationId: string): Promise<ApplicationDocument[]> {
    const appRes = await this.db.query(
      'SELECT id, customer_id FROM applications WHERE id = $1',
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new NotFoundError('Application not found');
    }

    // Customer or Staff check
    const userRes = await this.db.query(
      'SELECT r.code as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.id = $1',
      [userId]
    );
    const role = userRes.rows[0]?.role;

    if (appRes.rows[0].customer_id !== userId && !['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT'].includes(role)) {
      throw new ForbiddenError('Unauthorized access to application documents');
    }

    const docRes = await this.db.query(
      'SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
      [applicationId]
    );

    return docRes.rows.map((doc: any) => ({
      id: doc.id,
      applicationId: doc.application_id,
      documentType: doc.document_type,
      s3Key: doc.s3_key,
      fileName: doc.file_name,
      fileSizeBytes: Number(doc.file_size_bytes),
      mimeType: doc.mime_type,
      uploadedByUserId: doc.uploaded_by_user_id,
      status: doc.status,
      rejectionReason: doc.rejection_reason || undefined,
      uploadedAt: doc.uploaded_at.toISOString(),
    }));
  }

  /**
   * Verify or reject a document (Staff / Agent endpoint).
   */
  async verifyDocument(
    staffUserId: string,
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<ApplicationDocument> {
    const userRes = await this.db.query(
      'SELECT r.code as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.id = $1',
      [staffUserId]
    );
    const role = userRes.rows[0]?.role;

    if (!['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT'].includes(role)) {
      throw new ForbiddenError('Unauthorized: Only staff members can verify documents');
    }

    const docRes = await this.db.query(
      'SELECT * FROM application_documents WHERE id = $1',
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new NotFoundError('Document not found');
    }

    const res = await this.db.query(
      `UPDATE application_documents SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *`,
      [status, rejectionReason || null, documentId]
    );

    const doc = res.rows[0];

    await auditService.logEvent({
      actorUserId: staffUserId,
      action: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      entityType: 'application_documents',
      entityId: doc.id,
      metadata: {
        applicationId: doc.application_id,
        status,
        rejectionReason,
      },
    });

    return {
      id: doc.id,
      applicationId: doc.application_id,
      documentType: doc.document_type,
      s3Key: doc.s3_key,
      fileName: doc.file_name,
      fileSizeBytes: Number(doc.file_size_bytes),
      mimeType: doc.mime_type,
      uploadedByUserId: doc.uploaded_by_user_id,
      status: doc.status,
      rejectionReason: doc.rejection_reason || undefined,
      uploadedAt: doc.uploaded_at.toISOString(),
    };
  }
}

export const documentsService = new DocumentsService();
