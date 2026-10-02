import { PoolClient } from 'pg';

export async function up004(client: PoolClient): Promise<void> {
  await client.query(`
    -- Add icon_url to products if not existing
    ALTER TABLE products ADD COLUMN IF NOT EXISTS icon_url TEXT;

    -- Banking / Lending Partners Table
    CREATE TABLE IF NOT EXISTS partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      logo_url TEXT,
      contact_email VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Product-to-Partner Junction Mapping
    CREATE TABLE IF NOT EXISTS product_partners (
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT false,
      revenue_share_percentage NUMERIC(5,2) DEFAULT 0.00,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (product_id, partner_id)
    );

    -- Dynamic Form Schemas Table
    CREATE TABLE IF NOT EXISTS form_schemas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      version INT NOT NULL DEFAULT 1,
      title VARCHAR(150) NOT NULL,
      steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_published BOOLEAN DEFAULT false,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_form_schemas_product ON form_schemas(product_id);
    CREATE INDEX IF NOT EXISTS idx_form_schemas_published ON form_schemas(product_id, is_published);
    CREATE INDEX IF NOT EXISTS idx_product_partners_product ON product_partners(product_id);
  `);
}
