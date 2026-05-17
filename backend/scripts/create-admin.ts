import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// Load .env from backend/ root (one level up from scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

// Import pool AFTER dotenv is loaded
const { default: pool } = await import('../src/config/database.js');

const args     = process.argv.slice(2);
const name     = args[0] || 'GSC Admin';
const email    = args[1] || 'admin@globalsustainabilitycouncil.com';
const password = args[2] || 'Change_me_immediately!';

const hash = await bcrypt.hash(password, 12);

await pool.execute(
  `INSERT INTO users (name, email, password_hash, role, status, auth_provider)
   VALUES (?, ?, ?, 'founding_member', 'approved', 'local')
   ON DUPLICATE KEY UPDATE role='founding_member', status='approved', password_hash=?`,
  [name, email, hash, hash],
);

console.log('✅ Admin created successfully');
console.log('   Name:  ', name);
console.log('   Email: ', email);
console.log('   Role:   founding_member');
console.log('\n⚠️  Now run the seed files in Workbench:');
console.log('   seeds/01_app_settings.sql');
console.log('   seeds/02_awards.sql');
console.log('   seeds/03_framework.sql');

process.exit(0);