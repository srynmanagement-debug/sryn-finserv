import { PoolClient } from 'pg';

export async function up006(client: PoolClient): Promise<void> {
  await client.query(`
    -- Extend applications table for submission idempotency and resubmission tracking
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS submission_idempotency_key VARCHAR(255) UNIQUE;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS additional_info_requested_notes TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS resubmitted_at TIMESTAMPTZ;

    -- Application Documents Table
    CREATE TABLE IF NOT EXISTS application_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      document_type VARCHAR(100) NOT NULL,
      s3_key TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size_bytes BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
      rejection_reason TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_application_documents_app ON application_documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_applications_idempotency ON applications(submission_idempotency_key);
  `);
}
