import 'dotenv/config';

const required = [
  'DB_HOST','DB_USER','DB_PASSWORD','DB_NAME',
  'JWT_SECRET',
  'AZURE_STORAGE_ACCOUNT_NAME','AZURE_STORAGE_ACCOUNT_KEY','AZURE_STORAGE_CONTAINER_NAME',
] as const;
required.forEach((key) => { if (!process.env[key]) console.warn('Missing env: ' + key); });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT:     parseInt(process.env.PORT || '5000', 10),
  DB_HOST:     process.env.DB_HOST!,
  DB_USER:     process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME:     process.env.DB_NAME || 'gsc_database',
  DB_PORT:     parseInt(process.env.DB_PORT || '3306', 10),
  JWT_SECRET:     process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME:    'gsc_token',
  AZURE_STORAGE_ACCOUNT_NAME:   process.env.AZURE_STORAGE_ACCOUNT_NAME!,
  AZURE_STORAGE_ACCOUNT_KEY:    process.env.AZURE_STORAGE_ACCOUNT_KEY!,
  AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME!,
  FIREBASE_PROJECT_ID:    process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL:  process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY:   process.env.FIREBASE_PRIVATE_KEY,
  SMTP_HOST:  process.env.SMTP_HOST,
  SMTP_PORT:  parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER:  process.env.SMTP_USER,
  SMTP_PASS:  process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@globalsustainabilitycouncil.com',
  LINKEDIN_CLIENT_ID:     process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  FRONTEND_URL:         process.env.FRONTEND_URL || 'http://localhost:5173',
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
  NEWS_API_KEY:         process.env.NEWS_API_KEY,
} as const;
