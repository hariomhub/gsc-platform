import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { env } from '../config/env.js';

const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!env.RECAPTCHA_SECRET_KEY) { next(); return; }
  const token = req.body?.recaptchaToken;
  if (!token) {
    res.status(400).json({ success: false, message: 'reCAPTCHA token missing.' });
    return;
  }
  try {
    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret: env.RECAPTCHA_SECRET_KEY, response: token } },
    );
    if (!data.success || data.score < 0.5) {
      res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ success: false, message: 'reCAPTCHA check failed.' });
  }
};

export default verifyRecaptcha;
