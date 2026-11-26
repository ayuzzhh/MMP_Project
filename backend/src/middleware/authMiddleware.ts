import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { RoleType, UserProfile } from '../types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

/**
 * Middleware: Requires a valid JWT token in HTTP-Only Cookie or Authorization Header
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check HTTP-Only Cookie
    if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.token || req.cookies.jwt;
    }

    // 2. Check Authorization Header (Bearer <token>)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'No authorization token provided. Please log in to proceed.'
      });
    }

    // 3. Verify JWT signature and expiration
    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.findUserById(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_OR_DEACTIVATED_USER',
        message: 'User account is deactivated or no longer exists.'
      });
    }

    // 4. Attach populated profile to request
    req.user = AuthService.toUserProfile(user);
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Failed to authenticate token.'
    });
  }
}

/**
 * Optional Auth: Attaches user if token is present, but doesn't block unauthenticated requests
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.token || req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.findUserById(decoded.id);
      if (user && user.is_active) {
        req.user = AuthService.toUserProfile(user);
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
}

/**
 * Middleware: Role-Based Authorization Guard
 */
export function requireRole(...allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required prior to role evaluation.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_ROLE_PRIVILEGES',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}.`
      });
    }

    next();
  };
}

/**
 * Middleware: Fine-grained Permission Guard
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required prior to permission evaluation.'
      });
    }

    const userPermissions = new Set(req.user.permissions);
    const missingPermissions = requiredPermissions.filter(p => !userPermissions.has(p));

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Missing required permission(s): [${missingPermissions.join(', ')}].`,
        missing_permissions: missingPermissions
      });
    }

    next();
  };
}
