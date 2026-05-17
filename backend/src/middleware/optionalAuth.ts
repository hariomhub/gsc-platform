import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RequestUser } from '../types/api.types.js';

const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (token) {
    try {
      req.user! = jwt.verify(token, env.JWT_SECRET) as RequestUser;
    } catch { /* ignore */ }
  }
  next();
};

export default optionalAuth;
