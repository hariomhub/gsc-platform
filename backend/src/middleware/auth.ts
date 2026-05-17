import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RequestUser } from '../types/api.types.js';

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as RequestUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

export default auth;
