import { PoolClient } from 'pg';

export async function up002(client: PoolClient): Promise<void> {
  await client.query(`
    -- Product Categories Table
    CREATE TABLE IF NOT EXISTS product_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Product Subcategories Table
    CREATE TABLE IF NOT EXISTS product_subcategories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Dynamic Products Table
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      category_id UUID NOT NULL REFERENCES product_categories(id),
      subcategory_id UUID REFERENCES product_subcategories(id),
      partner_id UUID REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'DRAFT',
      version INT DEFAULT 1,
      description TEXT,
      eligibility_rules JSONB DEFAULT '[]'::jsonb,
      document_requirements JSONB DEFAULT '[]'::jsonb,
      effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      effective_to TIMESTAMPTZ,
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Product Config Versions History
    CREATE TABLE IF NOT EXISTS product_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      version INT NOT NULL,
      config_snapshot JSONB NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Applications Table
    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id UUID NOT NULL REFERENCES users(id),
      agent_id UUID REFERENCES users(id),
      retailer_id UUID REFERENCES users(id),
      product_id UUID NOT NULL REFERENCES products(id),
      product_version_snapshot INT NOT NULL DEFAULT 1,
      pricing_snapshot JSONB DEFAULT '{}'::jsonb,
      commission_snapshot JSONB DEFAULT '{}'::jsonb,
      form_data JSONB DEFAULT '{}'::jsonb,
      current_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
      current_step INT DEFAULT 1,
      assigned_manager_id UUID REFERENCES users(id),
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Application Status Transition History
    CREATE TABLE IF NOT EXISTS application_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      from_status VARCHAR(50),
      to_status VARCHAR(50) NOT NULL,
      changed_by_user_id UUID REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_applications_customer ON applications(customer_id);
    CREATE INDEX IF NOT EXISTS idx_applications_agent ON applications(agent_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(current_status);
  `);
}
