import { PoolClient } from 'pg';

export async function up003(client: PoolClient): Promise<void> {
  await client.query(`
    -- Commission Ledger Table (Append-Only)
    CREATE TABLE IF NOT EXISTS commission_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES applications(id),
      beneficiary_user_id UUID NOT NULL REFERENCES users(id),
      beneficiary_role VARCHAR(50) NOT NULL,
      rule_id UUID,
      rule_version_snapshot INT DEFAULT 1,
      calculated_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'INR',
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      payout_batch_id VARCHAR(100),
      reference_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs Table (Immutable Log)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action VARCHAR(100) NOT NULL,
      actor_user_id UUID REFERENCES users(id),
      actor_role VARCHAR(50),
      ip_address VARCHAR(45),
      user_agent TEXT,
      entity_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(100) NOT NULL,
      old_value JSONB,
      new_value JSONB,
      metadata JSONB,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_commission_ledger_app ON commission_ledger(application_id);
    CREATE INDEX IF NOT EXISTS idx_commission_ledger_user ON commission_ledger(beneficiary_user_id);
    CREATE INDEX IF NOT EXISTS idx_commission_ledger_status ON commission_ledger(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
  `);
}
