import { PoolClient } from 'pg';

export async function up007(client: PoolClient): Promise<void> {
  await client.query(`
    -- Extend partners table for distributor/retailer onboarding & auth linkage
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type VARCHAR(50) DEFAULT 'RETAILER';
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'APPROVED';
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS gstin VARCHAR(50);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS pan_number VARCHAR(50);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_notes TEXT;
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
    ALTER TABLE partners ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

    -- Add retailer_id & referral_code to applications if not already existing
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS retailer_id UUID REFERENCES users(id);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS referral_code VARCHAR(100);

    -- Partner Referral Tracking Table
    CREATE TABLE IF NOT EXISTS partner_referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      referrer_user_id UUID NOT NULL REFERENCES users(id),
      referral_code VARCHAR(100) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      product_id UUID REFERENCES products(id),
      application_id UUID REFERENCES applications(id),
      status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
    CREATE INDEX IF NOT EXISTS idx_partners_onboarding ON partners(onboarding_status);
    CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_id);
    CREATE INDEX IF NOT EXISTS idx_partner_referrals_referrer ON partner_referrals(referrer_user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_retailer ON applications(retailer_id);
  `);
}
