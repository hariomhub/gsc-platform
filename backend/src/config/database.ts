import mysql from 'mysql2/promise';
import { env } from './env.js';

const pool = mysql.createPool({
  host:               env.DB_HOST,
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  port:               env.DB_PORT,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  ssl:                { rejectUnauthorized: false },
});

pool.getConnection()
  .then((conn) => { console.log('Connected to MySQL:', env.DB_NAME); conn.release(); })
  .catch((err: Error) => { console.error('MySQL connection failed:', err.message); process.exit(1); });

export default pool;
