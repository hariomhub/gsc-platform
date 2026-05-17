export const EVENT_CATEGORIES = ['all', 'webinar', 'seminar', 'workshop', 'podcast'] as const;
export type EventCategoryFilter = typeof EVENT_CATEGORIES[number];

export const RESOURCE_TYPES = {
  FRAMEWORK:  'framework',
  WHITEPAPER: 'whitepaper',
  REPORT:     'report',
  POLICY:     'policy',
  VIDEO:      'video',
  ARTICLE:    'article',
  TOOL:       'tool',
} as const;

export const FEED_POST_TYPES = {
  ESG_PRODUCT: 'esg_product',
  POLL:        'poll',
  EVENT:       'event',
  CASE_STUDY:  'case_study',
  GENERAL:     'general',
} as const;

export const FEED_POST_TYPE_LABELS = {
  esg_product: 'ESG Tool / Product',
  poll:        'Poll',
  event:       'Event',
  case_study:  'Case Study',
  general:     'General',
} as const;

export const NEWS_SOURCE_TYPES = ['climate','esg','csrd','carbon','biodiversity','general'] as const;
export type NewsSourceType = typeof NEWS_SOURCE_TYPES[number];

export const SUSTAINABILITY_FRAMEWORKS = [
  'GRI Standards', 'CSRD/ESRS', 'TCFD', 'ISSB IFRS S1 S2',
  'GHG Protocol', 'CDP', 'UN SDGs', 'SBTi', 'ISO 14064', 'CSDDD',
] as const;

export const USER_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' } as const;

export const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10 } as const;

export const FILE_LIMITS = {
  MAX_PDF_SIZE:   10 * 1024 * 1024,
  MAX_IMAGE_SIZE:  5 * 1024 * 1024,
  ACCEPTED_PDF_TYPES:   ['application/pdf'],
  ACCEPTED_IMAGE_TYPES: ['image/jpeg','image/jpg','image/png','image/webp','image/gif'],
} as const;
