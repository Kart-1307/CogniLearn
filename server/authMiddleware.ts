import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const isProd = process.env.NODE_ENV === 'production';

// Strict validation of JWT Secret
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('super_secret_jwt_key_2026'))) {
  console.error('\n❌ [FATAL SECURITY ERROR]: Production requires a strong, unique JWT_SECRET.');
  console.error('Refusing to start server with missing or default secret.\n');
  process.exit(1);
}

export const JWT_SECRET = process.env.JWT_SECRET || 'cognilearn_dev_jwt_key_only_change_in_production';

export interface AuthenticatedUser {
  id: string;
  role: 'student' | 'teacher';
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      userId?: string;
      userRole?: 'student' | 'teacher';
    }
  }
}

/**
 * Verifies JWT token and attaches user identity to request object
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: 'student' | 'teacher'; email?: string };
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
    } else {
      res.status(401).json({ message: 'Invalid or forged token.' });
    }
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 */
export const requireRole = (allowedRoles: Array<'student' | 'teacher'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      res.status(403).json({ message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles.` });
      return;
    }
    next();
  };
};

/**
 * Insecure Direct Object Reference (IDOR) Guard:
 * Guarantees that students can only access or modify records matching their own userId.
 */
export const requireSelfOrTeacher = (targetParamName: string = 'studentId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targetId = req.params[targetParamName] || req.body[targetParamName] || req.query[targetParamName];
    
    if (req.userRole === 'teacher') {
      // Teachers are authorized to review student records
      next();
      return;
    }

    if (req.userRole === 'student') {
      if (String(targetId) !== String(req.userId)) {
        res.status(403).json({ message: 'Forbidden: Students are not authorized to view other students records.' });
        return;
      }
      next();
      return;
    }

    res.status(403).json({ message: 'Access denied.' });
  };
};
