export type RoleType = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  role: RoleType;
  is_active: boolean;
  is_verified: boolean;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: RoleType;
  is_active: boolean;
  is_verified: boolean;
  wallet_balance: number;
  permissions: string[];
  created_at: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: RoleType;
  iat?: number;
  exp?: number;
}

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  USER: [
    'properties:read',
    'reports:unlock',
    'reports:read_own',
    'wallet:read',
    'wallet:purchase',
    'reports:submit_complaint'
  ],
  ADMIN: [
    'properties:read',
    'properties:create',
    'properties:edit',
    'records:ownership:manage',
    'records:legal:manage',
    'records:encumbrance:manage',
    'documents:upload',
    'documents:ocr_review',
    'verification:submit_change',
    'user_reports:review',
    'reports:unlock',
    'reports:read_own',
    'wallet:read'
  ],
  SUPER_ADMIN: [
    'properties:read',
    'properties:create',
    'properties:edit',
    'properties:approve',
    'properties:delete',
    'records:ownership:manage',
    'records:legal:manage',
    'records:encumbrance:manage',
    'documents:upload',
    'documents:ocr_review',
    'verification:approve_change',
    'verification:reject_change',
    'tokens:pricing:manage',
    'tokens:refund',
    'admins:manage',
    'users:manage',
    'audit:read',
    'reports:unlock',
    'reports:read_own',
    'wallet:read'
  ]
};
