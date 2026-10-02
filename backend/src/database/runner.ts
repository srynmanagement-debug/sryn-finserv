import { DatabaseConnection } from './connection';
import { logger } from '../common/utils/logger';
import { up001 } from './migrations/001_core_rbac';
import { up002 } from './migrations/002_products_and_applications';
import { up003 } from './migrations/003_commissions_and_audit';
import { up004 } from './migrations/004_form_schemas_and_partners';
import { up005 } from './migrations/005_pricing_and_commission_engine';
import { up006 } from './migrations/006_customer_applications_and_documents';
import { up007 } from './migrations/007_partner_onboarding_and_network';

export interface MigrationDef {
  version: string;
  name: string;
  up: (client: any) => Promise<void>;
}

export const MIGRATIONS: MigrationDef[] = [
  { version: '001', name: 'core_rbac_tables', up: up001 },
  { version: '002', name: 'products_and_applications_tables', up: up002 },
  { version: '003', name: 'commissions_and_audit_tables', up: up003 },
  { version: '004', name: 'form_schemas_and_partners_tables', up: up004 },
  { version: '005', name: 'pricing_and_commission_engine_tables', up: up005 },
  { version: '006', name: 'customer_applications_and_documents_tables', up: up006 },
  { version: '007', name: 'partner_onboarding_and_network', up: up007 },
];

export async function runMigrations(): Promise<{ executed: string[]; skipped: string[] }> {
  const db = DatabaseConnection.getInstance();
  const client = await db.getClient();

  const executed: string[] = [];
  const skipped: string[] = [];

  try {
    await client.query('BEGIN');

    // Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fetch applied migration versions
    const res = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(res.rows.map((r: any) => r.version));

    for (const migration of MIGRATIONS) {
      if (appliedVersions.has(migration.version)) {
        skipped.push(migration.version);
        continue;
      }

      logger.info(`Applying database migration [${migration.version}] ${migration.name}...`);
      await migration.up(client);
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );
      executed.push(migration.version);
    }

    await client.query('COMMIT');
    logger.info(`Migrations finished: ${executed.length} executed, ${skipped.length} skipped.`);
    return { executed, skipped };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Database migration failed, transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Allow CLI execution via `node dist/database/runner.js`
if (require.main === module) {
  runMigrations()
    .then((res) => {
      console.log('Migration Result:', JSON.stringify(res));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration Execution Error:', err);
      process.exit(1);
    });
}
