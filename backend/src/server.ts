import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import session from 'express-session';
import { env } from './config/env.js';
import './config/database.js';
import './config/firebase.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import passport from './middleware/passport.js';
import { registerRoutes } from './routes/index.js';
import { initAllJobs } from './jobs/index.js';

// ── Express App ────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// ── Domain Canonicalization ────────────────────────────────────────────────────
app.use((req, res, next) => {
  // Update to GSC production domain when deployed
  if (req.hostname === 'globalsustainabilitycouncil.com') {
    res.redirect(301, `https://www.globalsustainabilitycouncil.com${req.originalUrl}`);
  }
  next();
});

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc:     ["'self'", "data:", "blob:", "https:", "http:"],
      mediaSrc:   ["'self'", "blob:", "https:", "https://*.blob.core.windows.net", "https://www.youtube.com"],
      frameSrc:   ["'self'", "https://www.google.com", "https://www.youtube.com", "https://www.recaptcha.net"],
      connectSrc: ["'self'", "https:", "wss:"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
    if (isLocalhost && env.NODE_ENV !== 'production') return callback(null, true);
    if (origin === env.FRONTEND_URL) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use(session({
  secret:            env.JWT_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: env.NODE_ENV === 'production', httpOnly: true, maxAge: 5 * 60 * 1000 },
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(generalLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
registerRoutes(app, authLimiter);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', platform: 'GSC', timestamp: new Date().toISOString() } });
});

// ── Serve Frontend in Production ───────────────────────────────────────────────
if (env.NODE_ENV === 'production') {
  const { fileURLToPath } = await import('url');
  const path = await import('path');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🌿 GSC Backend running on http://localhost:${env.PORT}`);
  initAllJobs();
});
