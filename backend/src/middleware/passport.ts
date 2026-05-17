import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import pool from '../config/database.js';
import { env } from '../config/env.js';

if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy(
    {
      clientID:     env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
      callbackURL:  `${env.FRONTEND_URL}/auth/callback`,
      scope:        ['openid', 'profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from LinkedIn'), false);

        const [rows] = await pool.execute<any[]>(
          'SELECT * FROM users WHERE email = ? OR linkedin_id = ? LIMIT 1',
          [email, profile.id],
        );

        if ((rows as any).length > 0) {
          const user = rows[0];
          await pool.execute(
            'UPDATE users SET linkedin_id = ?, auth_provider = "linkedin" WHERE id = ?',
            [profile.id, user.id],
          );
          return done(null, user);
        }

        // New user via LinkedIn — create with pending status
        const [result] = await pool.execute<any>(
          `INSERT INTO users (name, email, linkedin_id, linkedin_url, auth_provider, status, role)
           VALUES (?, ?, ?, ?, 'linkedin', 'pending', 'professional')`,
          [
            profile.displayName || email.split('@')[0],
            email,
            profile.id,
            (profile as any).profileUrl || null,
          ],
        );
        const [newUser] = await pool.execute<any[]>(
          'SELECT * FROM users WHERE id = ? LIMIT 1',
          [(result as any).insertId],
        );
        return done(null, newUser[0]);
      } catch (err: any) {
        return done(err as Error, false);
      }
    },
  ));
}

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  try {
    const [rows] = await pool.execute<any[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    done(null, rows[0] || false);
  } catch (err: any) {
    done(err, false);
  }
});

export default passport;
