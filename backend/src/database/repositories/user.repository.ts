import { DatabaseConnection } from '../connection';
import { UserProfile, UserRole } from '@sryn/types';
import { logger } from '../../common/utils/logger';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  permissions: string[];
  cognitoSub?: string;
  isActive: boolean;
  managerId?: string;
  teamLeaderId?: string;
  partnerId?: string;
}

export class UserRepository {
  private db = DatabaseConnection.getInstance();

  public async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      const res = await this.db.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.cognito_sub, u.is_active,
                r.code as role_code,
                ur_rep.manager_id, ur_rep.team_leader_id, ur_rep.partner_id
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         LEFT JOIN user_reporting ur_rep ON u.id = ur_rep.user_id
         WHERE u.email = $1 AND u.is_deleted = false
         LIMIT 1;`,
        [email]
      );

      if (res.rows.length === 0) return null;
      const row = res.rows[0];

      const permsRes = await this.db.query(
        `SELECT p.code FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = $1;`,
        [row.id]
      );

      const permissions = permsRes.rows.map((p: any) => p.code);

      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        role: (row.role_code || 'CUSTOMER') as UserRole,
        permissions: permissions.length > 0 ? permissions : ['application:read_own'],
        cognitoSub: row.cognito_sub,
        isActive: row.is_active,
        managerId: row.manager_id,
        teamLeaderId: row.team_leader_id,
        partnerId: row.partner_id,
      };
    } catch (err) {
      logger.warn(`[UserRepository] DB query failed for email ${email}, falling back:`, (err as Error).message);
      return null;
    }
  }

  public async findById(id: string): Promise<UserRecord | null> {
    try {
      const res = await this.db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.cognito_sub, u.is_active,
                r.code as role_code,
                ur_rep.manager_id, ur_rep.team_leader_id, ur_rep.partner_id
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         LEFT JOIN user_reporting ur_rep ON u.id = ur_rep.user_id
         WHERE u.id = $1 AND u.is_deleted = false
         LIMIT 1;`,
        [id]
      );

      if (res.rows.length === 0) return null;
      const row = res.rows[0];

      const permsRes = await this.db.query(
        `SELECT p.code FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = $1;`,
        [row.id]
      );

      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        role: (row.role_code || 'CUSTOMER') as UserRole,
        permissions: permsRes.rows.map((p: any) => p.code),
        cognitoSub: row.cognito_sub,
        isActive: row.is_active,
        managerId: row.manager_id,
        teamLeaderId: row.team_leader_id,
        partnerId: row.partner_id,
      };
    } catch (err) {
      logger.warn(`[UserRepository] DB query failed for ID ${id}:`, (err as Error).message);
      return null;
    }
  }

  public async assignRole(userId: string, roleCode: UserRole): Promise<boolean> {
    try {
      const roleRes = await this.db.query('SELECT id FROM roles WHERE code = $1 LIMIT 1', [roleCode]);
      if (roleRes.rows.length === 0) return false;
      const roleId = roleRes.rows[0].id;

      await this.db.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
      await this.db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
      return true;
    } catch (err) {
      logger.error(`[UserRepository] Failed to assign role ${roleCode} to user ${userId}:`, err);
      return false;
    }
  }
}
