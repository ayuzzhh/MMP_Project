import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters long'),
  phone_number: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Admin password must be at least 8 characters long'),
  full_name: z.string().min(2, 'Full name is required'),
  phone_number: z.string().optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: "Role must be either 'ADMIN' or 'SUPER_ADMIN'" })
  })
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({ success: false, error: 'Malformed request body' });
    }
  };
}
