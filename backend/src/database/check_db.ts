import { DatabaseConnection } from './connection';

async function checkDatabase() {
  const db = DatabaseConnection.getInstance();
  const client = await db.getClient();

  try {
    const migrationsRes = await client.query('SELECT * FROM schema_migrations ORDER BY version ASC');
    console.log('--- Applied Migrations ---');
    console.table(migrationsRes.rows);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);
    console.log('--- Database Tables ---');
    console.table(tablesRes.rows);

    const indexesRes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname ASC
    `);
    console.log(`--- Indexes Count: ${indexesRes.rows.length} ---`);

    const fkRes = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);
    console.log(`--- Foreign Keys Count: ${fkRes.rows.length} ---`);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkDatabase();
