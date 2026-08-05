export const CACHE_KEYS = {
  NEWS_FEED:      'news:feed',
  NEWS_ARTICLE:   'news:article',
  NEWS_TRENDING:  'news:trending',
  CATEGORIES:     'categories:all',
  USER_PROFILE:   'user:profile',
  USER_BOOKMARKS: 'user:bookmarks',
  SEARCH_RESULTS: 'search:results',
  ADS_ACTIVE:     'ads:active',
} as const;

export const QUEUE_NAMES = {
  NOTIFICATION:   'notification',
  AI_PROCESSING:  'ai-processing',
  ANALYTICS:      'analytics',
  EMAIL:          'email',
  TRANSLATION:    'translation',
} as const;

export const QUEUE_JOBS = {
  SEND_PUSH_NOTIFICATION: 'send-push-notification',
  SEND_BULK_NOTIFICATION: 'send-bulk-notification',
  GENERATE_AI_SUMMARY:    'generate-ai-summary',
  GENERATE_AI_TAGS:       'generate-ai-tags',
  TRANSLATE_ARTICLE:      'translate-article',
  TRACK_ANALYTICS:        'track-analytics',
  GENERATE_AI_HEADLINE:   'generate-ai-headline',
} as const;

export const SUPPORTED_LANGUAGES = [
  'EN', 'HI', 'UR', 'AR', 'FR', 'DE', 'ES',
  'ZH', 'JA', 'KO', 'PT', 'RU', 'BN', 'TA', 'TE',
] as const;

export const DEFAULT_PAGINATION = {
  PAGE:      1,
  LIMIT:     20,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
} as const;

export const S3_FOLDERS = {
  ARTICLE_IMAGES: 'articles/',
  USER_AVATARS:   'avatars/',
  AD_IMAGES:      'advertisements/',
  CATEGORY_ICONS: 'categories/',
} as const;
