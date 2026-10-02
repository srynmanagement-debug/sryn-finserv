import { PoolClient } from 'pg';

export async function up005(client: PoolClient): Promise<void> {
  await client.query(`
    -- Pricing Rules Table
    CREATE TABLE IF NOT EXISTS pricing_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      version INT NOT NULL DEFAULT 1,
      rule_code VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      fee_type VARCHAR(50) NOT NULL,
      calculation_type VARCHAR(30) NOT NULL,
      fixed_amount_paise BIGINT DEFAULT 0,
      percentage_bps INT DEFAULT 0,
      slabs JSONB DEFAULT '[]'::jsonb,
      min_amount_paise BIGINT DEFAULT 0,
      max_amount_paise BIGINT,
      effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      effective_to TIMESTAMPTZ,
      is_published BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'DRAFT',
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Fee & Tax Components Table
    CREATE TABLE IF NOT EXISTS fee_tax_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
      tax_code VARCHAR(30) NOT NULL,
      tax_rate_bps INT NOT NULL DEFAULT 0,
      is_inclusive BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Multi-Tier Commission Rules Table
    CREATE TABLE IF NOT EXISTS commission_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      version INT NOT NULL DEFAULT 1,
      target_role VARCHAR(50) NOT NULL,
      rule_code VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      calculation_type VARCHAR(30) NOT NULL,
      fixed_amount_paise BIGINT DEFAULT 0,
      percentage_bps INT DEFAULT 0,
      slabs JSONB DEFAULT '[]'::jsonb,
      channel_filter JSONB DEFAULT '[]'::jsonb,
      location_filter JSONB DEFAULT '[]'::jsonb,
      min_target_threshold_paise BIGINT DEFAULT 0,
      max_allocation_cap_paise BIGINT,
      effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      effective_to TIMESTAMPTZ,
      is_published BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'DRAFT',
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Enhance Commission Ledger Table
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS original_ledger_id UUID REFERENCES commission_ledger(id);
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS reversal_reason TEXT;
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(id);
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
    ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS payout_reference VARCHAR(100);

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_pricing_rules_product ON pricing_rules(product_id);
    CREATE INDEX IF NOT EXISTS idx_commission_rules_product ON commission_rules(product_id);
    CREATE INDEX IF NOT EXISTS idx_commission_ledger_idempotency ON commission_ledger(idempotency_key);
  `);
}
