import { Express, RequestHandler } from 'express';
import authRoutes          from './auth.routes.js';
import eventsRoutes        from './events.routes.js';
import resourcesRoutes     from './resources.routes.js';
import teamRoutes          from './team.routes.js';
import feedRoutes          from './feed.routes.js';
import newsRoutes          from './news.routes.js';
import adminRoutes         from './admin.routes.js';
import profileRoutes       from './profile.routes.js';
import productReviewsRoutes from './productReviews.routes.js';
import nominationsRoutes   from './nominations.routes.js';
import frameworkRoutes     from './framework.routes.js';
import autoNewsRoutes      from './autoNews.routes.js';
import membershipRoutes    from './membership.routes.js';
import workshopsRoutes     from './workshops.routes.js';
import notificationsRoutes from './notifications.routes.js';

export function registerRoutes(app: Express, authLimiter: RequestHandler): void {
  app.use('/api/auth',            authLimiter, authRoutes);
  app.use('/api/events',          eventsRoutes);
  app.use('/api/resources',       resourcesRoutes);
  app.use('/api/team',            teamRoutes);
  app.use('/api/feed',            feedRoutes);
  app.use('/api/news',            newsRoutes);
  app.use('/api/admin/auto-news', autoNewsRoutes);
  app.use('/api/admin',           adminRoutes);
  app.use('/api/profile',         profileRoutes);
  app.use('/api/product-reviews', productReviewsRoutes);
  app.use('/api/nominations',     nominationsRoutes);
  app.use('/api/framework',       frameworkRoutes);
  app.use('/api/membership',      membershipRoutes);
  app.use('/api/workshops',       workshopsRoutes);
  app.use('/api/notifications',   notificationsRoutes);
}
