import { initNewsFetchCron }        from './newsFetch.job.js';
import { initMembershipExpiryCron } from './membershipExpiry.job.js';
import { initNotificationDigestCron } from './notificationDigest.job.js';
import { initFeedScoreCron }       from './feedScore.job.js';
import { initFeedLikeDigestCron }  from './feedLikeDigest.job.js';

export function initAllJobs(): void {
  initNewsFetchCron();
  console.log('News fetch cron initialized');

  initMembershipExpiryCron();
  console.log('Membership expiry cron initialized');

  initNotificationDigestCron();
  console.log('Notification digest cron initialized');

  initFeedScoreCron();
  console.log('Feed score cron initialized');

  initFeedLikeDigestCron();
  console.log('Feed like digest cron initialized');
}
