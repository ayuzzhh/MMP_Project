import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

const isProduction = process.env.NODE_ENV === 'production';

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { email, password, full_name, phone_number } = req.body;

      const userProfile = await AuthService.createUser({
        email,
        password,
        full_name,
        phone_number,
        role: 'USER'
      });

      const token = AuthService.generateToken(userProfile);

      // Set Secure HTTP-Only Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully. 10 welcome tokens credited to your wallet.',
        token,
        user: userProfile
      });
    } catch (err: any) {
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email address already exists.'
        });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been deactivated. Please contact platform administration.'
        });
      }

      const isValidPassword = await AuthService.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        });
      }

      const userProfile = AuthService.toUserProfile(user);
      const token = AuthService.generateToken(userProfile);

      // Set Secure HTTP-Only Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: userProfile
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax'
    });
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  public static getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'NOT_AUTHENTICATED'
      });
    }
    return res.json({
      success: true,
      user: req.user
    });
  }

  public static async listUsers(req: Request, res: Response) {
    try {
      const users = await AuthService.listAllUsers();
      return res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async reauthenticate(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { password } = req.body;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'NOT_AUTHENTICATED' });
      }
      if (!password) {
        return res.status(400).json({ success: false, error: 'PASSWORD_REQUIRED', message: 'Password is required to confirm action.' });
      }

      const isValid = await AuthService.verifyAdminPassword(user.id, password);
      if (!isValid) {
        return res.status(403).json({ success: false, error: 'INVALID_ADMIN_PASSWORD', message: 'Invalid admin password confirmation.' });
      }

      return res.json({
        success: true,
        message: 'Admin authorization reconfirmed successfully.',
        confirmed_at: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async createAdmin(req: Request, res: Response) {
    try {
      const { email, password, full_name, phone_number, role } = req.body;

      const adminProfile = await AuthService.createUser({
        email,
        password,
        full_name,
        phone_number,
        role: role || 'ADMIN'
      });

      return res.status(201).json({
        success: true,
        message: `Admin user [${adminProfile.full_name}] created with role [${adminProfile.role}].`,
        user: adminProfile
      });
    } catch (err: any) {
      if (err.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email address already exists.'
        });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
