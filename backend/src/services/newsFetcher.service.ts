import Parser from 'rss-parser';
import pool from '../config/database.js';
import { logger } from '../utils/logger.js';

const parser = new Parser();

// GSC sustainability news RSS feeds
const SUSTAINABILITY_RSS_FEEDS = [
  { url: 'https://esgnews.com/feed/',              source: 'ESG News',        type: 'esg' },
  { url: 'https://www.esgtoday.com/feed/',         source: 'ESG Today',       type: 'esg' },
  { url: 'https://www.carbonbrief.org/feed/',      source: 'Carbon Brief',    type: 'climate' },
  { url: 'https://www.greenbiz.com/rss.xml',       source: 'GreenBiz',        type: 'climate' },
  { url: 'https://www.businessgreen.com/feed',     source: 'BusinessGreen',   type: 'esg' },
  { url: 'https://sustainablebrands.com/rss.xml',  source: 'Sustainable Brands', type: 'general' },
];

export async function fetchSustainabilityNews(): Promise<void> {
  logger.info('Fetching sustainability news...');
  let added = 0;

  for (const feed of SUSTAINABILITY_RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 10)) {
        if (!item.title || !item.link) continue;
        const [existing] = await pool.execute<any[]>(
          'SELECT id FROM news WHERE link = ? LIMIT 1',
          [item.link],
        );
        if ((existing as any).length > 0) continue;

        await pool.execute(
          'INSERT INTO news (title, summary, link, source_type, source_name, is_automated, status, is_published, fetched_at) VALUES (?,?,?,?,?, TRUE, \'PENDING\', FALSE, NOW())',
          [
            item.title.slice(0, 255),
            item.contentSnippet?.slice(0, 500) || item.summary?.slice(0, 500) || '',
            item.link.slice(0, 2000),
            feed.type,
            feed.source,
          ],
        );
        added++;
      }
    } catch (err: any) {
      logger.warn('RSS feed failed:', feed.source, err.message);
    }
  }
  logger.info('News fetch complete. Added:', added);
}
