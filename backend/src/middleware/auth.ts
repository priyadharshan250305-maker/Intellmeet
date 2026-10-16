import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: string;
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  return 'intellmeet_super_secure_jwt_dev_secret_key_987456!';
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };
    
    // Attempt database user lookup if DB is active, or construct basic user object
    let user = null;
    try {
      user = await User.findById(decoded.id);
    } catch (e) {
      // In case DB is not yet populated
    }

    if (user && user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
      return;
    }

    req.userId = decoded.id;
    req.userRole = decoded.role || (user ? user.role : 'user');
    if (user) {
      req.user = user;
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };
      req.userId = decoded.id;
      req.userRole = decoded.role;
      try {
        const user = await User.findById(decoded.id);
        if (user) req.user = user;
      } catch (e) {}
    }
  } catch (e) {
    // Silently continue for optional auth
  }
  next();
};
