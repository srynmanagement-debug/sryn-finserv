import { MIGRATIONS } from '../src/database/runner';

describe('Database Migration Structure', () => {
  it('should define sequential migration version numbers', () => {
    expect(MIGRATIONS.length).toBeGreaterThanOrEqual(3);
    expect(MIGRATIONS[0].version).toBe('001');
    expect(MIGRATIONS[1].version).toBe('002');
    expect(MIGRATIONS[2].version).toBe('003');
  });

  it('should have valid up function for each migration', () => {
    for (const migration of MIGRATIONS) {
      expect(typeof migration.up).toBe('function');
      expect(migration.name).toBeDefined();
    }
  });
});
