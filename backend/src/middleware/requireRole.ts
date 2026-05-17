import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user.types.js';

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user!) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (!roles.includes((req.user as any).role as UserRole)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      return;
    }
    next();
  };
