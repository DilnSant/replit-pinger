
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { LocalAuthenticatedRequest } from './auth-types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export async function authenticateUser(req: LocalAuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      userType: decoded.userType,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

export function checkRole(allowedRoles: string[]) {
  return (req: LocalAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin
    if (req.user.userType === 'admin') {
      return next(); // Admins can access everything
    }

    // Check if user role is in allowed roles
    if (req.user.userType && allowedRoles.includes(req.user.userType)) {
      return next();
    }

    // Special check for admin-only routes
    if (allowedRoles.includes('admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return res.status(403).json({ message: 'Insufficient permissions' });
  };
}
