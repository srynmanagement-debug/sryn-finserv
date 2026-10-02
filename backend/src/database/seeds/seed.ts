import bcrypt from 'bcryptjs';
import { DatabaseConnection } from '../connection';
import { SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@sryn/config';
import { logger } from '../../common/utils/logger';

export const SYSTEM_PERMISSIONS = [
  { code: 'product:create', name: 'Create Product', description: 'Create dynamic product configs', category: 'PRODUCT' },
  { code: 'product:update', name: 'Update Product', description: 'Update product configuration', category: 'PRODUCT' },
  { code: 'product:publish', name: 'Publish Product', description: 'Publish or archive product versions', category: 'PRODUCT' },
  { code: 'pricing:manage', name: 'Manage Pricing', description: 'Configure pricing rules and slabs', category: 'PRICING' },
  { code: 'commission:manage', name: 'Manage Commissions', description: 'Configure commission trees and rules', category: 'COMMISSION' },
  { code: 'application:create', name: 'Create Application', description: 'Initiate new application', category: 'APPLICATION' },
  { code: 'application:read', name: 'Read Applications', description: 'View application details', category: 'APPLICATION' },
  { code: 'application:verify', name: 'Verify Application', description: 'Perform KYC & document verification', category: 'APPLICATION' },
  { code: 'application:approve', name: 'Approve Application', description: 'Approve application for disbursal', category: 'APPLICATION' },
  { code: 'ledger:view', name: 'View Ledger', description: 'View commission ledger entries', category: 'FINANCIAL' },
  { code: 'ledger:payout_approve', name: 'Approve Payouts', description: 'Approve commission payout batches', category: 'FINANCIAL' },
  { code: 'audit:read', name: 'Read Audit Logs', description: 'View system compliance audit trail', category: 'SYSTEM' },
  { code: 'role:manage', name: 'Manage Roles', description: 'Manage RBAC role definitions', category: 'SYSTEM' },
  { code: 'role:assign', name: 'Assign User Roles', description: 'Assign roles & permissions to users', category: 'SYSTEM' },
  { code: 'user:manage', name: 'Manage Users', description: 'Manage user profiles', category: 'SYSTEM' },
];

export async function seedDatabase(): Promise<void> {
  const db = DatabaseConnection.getInstance();
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    logger.info('Seeding system permissions...');
    const permissionMap: Record<string, string> = {};
    for (const p of SYSTEM_PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (code, name, description, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code;`,
        [p.code, p.name, p.description, p.category]
      );
      permissionMap[res.rows[0].code] = res.rows[0].id;
    }

    logger.info('Seeding system roles...');
    const roleMap: Record<string, string> = {};
    for (const [key, roleCode] of Object.entries(SYSTEM_ROLES)) {
      const res = await client.query(
        `INSERT INTO roles (code, name, description, is_system)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, code;`,
        [roleCode, roleCode.replace('_', ' '), `System role for ${roleCode}`]
      );
      roleMap[res.rows[0].code] = res.rows[0].id;
    }

    logger.info('Seeding role permissions mapping...');
    for (const [roleCode, permList] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleCode];
      if (!roleId) continue;

      if (permList.includes('*')) {
        for (const pId of Object.values(permissionMap)) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [roleId, pId]
          );
        }
      } else {
        for (const pCode of permList) {
          const pId = permissionMap[pCode];
          if (pId) {
            await client.query(
              `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [roleId, pId]
            );
          }
        }
      }
    }

    // Seed default Super Admin user for local auth
    const adminEmail = 'admin@sryn.local';
    const passwordHash = await bcrypt.hash('Admin@Sryn2026', 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
       VALUES ($1, $2, 'Super', 'Admin', '9999999999', true)
       ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id;`,
      [adminEmail, passwordHash]
    );

    const superAdminUserId = userRes.rows[0].id;
    const superAdminRoleId = roleMap[SYSTEM_ROLES.SUPER_ADMIN];

    if (superAdminRoleId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [superAdminUserId, superAdminRoleId]
      );
    }

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
