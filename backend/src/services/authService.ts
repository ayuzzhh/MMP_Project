import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserProfile, RoleType, JwtPayload, ROLE_PERMISSIONS } from '../types/auth';
import { WalletService } from './walletService';
import { query } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_landguard_jwt_key_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Seeded passwords hashed with bcrypt:
// User: 'User@123'
// Admin: 'Admin@123'
// SuperAdmin: 'SuperAdmin@123'
export const MOCK_USERS_STORE: Map<string, User> = new Map([
  ['user@landguard.in', {
    id: 'demo-user-id',
    email: 'user@landguard.in',
    password_hash: bcrypt.hashSync('User@123', 10),
    full_name: 'Ayush Sharma (Citizen Buyer)',
    phone_number: '+91 9829012345',
    role: 'USER',
    is_active: true,
    is_verified: true,
    wallet_balance: 10,
    created_at: new Date('2026-01-15T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-15T10:00:00Z').toISOString()
  }],
  ['admin@landguard.in', {
    id: 'demo-admin-id',
    email: 'admin@landguard.in',
    password_hash: bcrypt.hashSync('Admin@123', 10),
    full_name: 'Pooja Verma (Verification Officer)',
    phone_number: '+91 9829054321',
    role: 'ADMIN',
    is_active: true,
    is_verified: true,
    wallet_balance: 50,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T10:00:00Z').toISOString()
  }],
  ['superadmin@landguard.in', {
    id: 'demo-superadmin-id',
    email: 'superadmin@landguard.in',
    password_hash: bcrypt.hashSync('SuperAdmin@123', 10),
    full_name: 'Dr. Rajesh Rathore (Super Admin)',
    phone_number: '+91 9829099999',
    role: 'SUPER_ADMIN',
    is_active: true,
    is_verified: true,
    wallet_balance: 100,
    created_at: new Date('2026-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T10:00:00Z').toISOString()
  }]
]);

export class AuthService {
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateToken(user: User | UserProfile): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }

  public static async findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try PostgreSQL if connected
    try {
      const sql = `
        SELECT u.*, COALESCE(u.role, 'USER') as role, COALESCE(w.balance, 0) as wallet_balance
        FROM users u
        LEFT JOIN token_wallets w ON u.id = w.user_id
        WHERE LOWER(u.email) = $1
        LIMIT 1;
      `;
      const res = await query(sql, [normalizedEmail]);
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          email: row.email,
          password_hash: row.password_hash,
          full_name: row.full_name,
          phone_number: row.phone_number || '',
          role: (row.role as RoleType) || 'USER',
          is_active: row.is_active,
          is_verified: row.is_verified,
          wallet_balance: parseInt(row.wallet_balance || '0', 10),
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
    } catch (err) {
      // Database not reachable, proceed with in-memory store
    }

    // 2. Fallback to in-memory store
    return MOCK_USERS_STORE.get(normalizedEmail) || null;
  }

  public static async findUserById(id: string): Promise<User | null> {
    // 1. Try PostgreSQL
    try {
      const sql = `
        SELECT u.*, COALESCE(u.role, 'USER') as role, COALESCE(w.balance, 0) as wallet_balance
        FROM users u
        LEFT JOIN token_wallets w ON u.id = w.user_id
        WHERE u.id = $1
        LIMIT 1;
      `;
      const res = await query(sql, [id]);
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          email: row.email,
          password_hash: row.password_hash,
          full_name: row.full_name,
          phone_number: row.phone_number || '',
          role: (row.role as RoleType) || 'USER',
          is_active: row.is_active,
          is_verified: row.is_verified,
          wallet_balance: parseInt(row.wallet_balance || '0', 10),
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
    } catch (err) {
      // Fallback
    }

    // 2. Fallback to in-memory store
    for (const user of MOCK_USERS_STORE.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  public static async createUser(params: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
    role?: RoleType;
  }): Promise<UserProfile> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await this.hashPassword(params.password);
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const role = params.role || 'USER';

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: params.full_name.trim(),
      phone_number: params.phone_number?.trim() || '+91 9800000000',
      role,
      is_active: true,
      is_verified: true,
      wallet_balance: 10, // 10 Free welcome tokens
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Persist user and wallet directly to PostgreSQL
    try {
      await query(`
        INSERT INTO users (
          id, email, password_hash, full_name, phone_number, role, is_active, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          phone_number = EXCLUDED.phone_number,
          updated_at = NOW();
      `, [userId, normalizedEmail, passwordHash, params.full_name.trim(), params.phone_number?.trim() || '+91 9800000000', role]);

      const walletId = `w-${userId}`;
      await query(`
        INSERT INTO token_wallets (id, user_id, balance, created_at, updated_at)
        VALUES ($1, $2, 10, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [walletId, userId]);
    } catch (err: any) {
      console.warn('⚠️ Warning persisting new user to PostgreSQL:', err.message);
    }

    // 2. Save to in-memory store for fast read access
    MOCK_USERS_STORE.set(normalizedEmail, newUser);

    // 3. Initialize wallet in runtime service
    WalletService.creditTokens(userId, 10, 'Welcome Bonus: 10 Due Diligence Tokens Credited');

    return this.toUserProfile(newUser);
  }

  public static async listAllUsers(): Promise<UserProfile[]> {
    try {
      const sql = `
        SELECT u.*, COALESCE(u.role, 'USER') as role, COALESCE(w.balance, 0) as wallet_balance
        FROM users u
        LEFT JOIN token_wallets w ON u.id = w.user_id
        ORDER BY u.created_at ASC;
      `;
      const res = await query(sql);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(row => ({
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          phone_number: row.phone_number || '',
          role: (row.role as RoleType) || 'USER',
          is_active: row.is_active,
          is_verified: row.is_verified,
          wallet_balance: parseInt(row.wallet_balance || '0', 10),
          permissions: ROLE_PERMISSIONS[(row.role as RoleType)] || [],
          created_at: row.created_at
        }));
      }
    } catch (err) {
      // Fallback to memory
    }

    const users: UserProfile[] = [];
    for (const user of MOCK_USERS_STORE.values()) {
      users.push(this.toUserProfile(user));
    }
    return users;
  }

  public static async verifyAdminPassword(userId: string, password: string): Promise<boolean> {
    if (!password || !userId) return false;
    const cleanPw = password.trim();

    // 1. Verify user exists and has administrative privileges
    const requestingUser = await this.findUserById(userId);
    if (!requestingUser || !requestingUser.is_active) {
      return false;
    }
    if (requestingUser.role !== 'ADMIN' && requestingUser.role !== 'SUPER_ADMIN') {
      return false;
    }

    // 2. Direct password verification against requesting administrator's hashed credentials
    if (requestingUser.password_hash) {
      const isMatch = await this.comparePassword(cleanPw, requestingUser.password_hash);
      if (isMatch) return true;
    }

    // 3. For authorized administrators, also permit reauthentication if providing valid credentials
    // of an active administrator in PostgreSQL (e.g. Super Admin or Verification Admin)
    try {
      const res = await query("SELECT password_hash FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = true");
      if (res && res.rows && res.rows.length > 0) {
        for (const row of res.rows) {
          if (row.password_hash && await this.comparePassword(cleanPw, row.password_hash)) {
            return true;
          }
        }
      }
    } catch {
      // Continue to in-memory fallback
    }

    // 4. In-memory fallback for active administrators
    for (const adminUser of MOCK_USERS_STORE.values()) {
      if ((adminUser.role === 'ADMIN' || adminUser.role === 'SUPER_ADMIN') && adminUser.is_active && adminUser.password_hash) {
        if (await this.comparePassword(cleanPw, adminUser.password_hash)) {
          return true;
        }
      }
    }

    return false;
  }

  public static toUserProfile(user: User): UserProfile {
    // Sync live wallet balance if available
    const liveWallet = WalletService.getWallet(user.id);
    const balance = liveWallet ? liveWallet.balance : user.wallet_balance;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      is_active: user.is_active,
      is_verified: user.is_verified,
      wallet_balance: balance,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      created_at: user.created_at
    };
  }
}
