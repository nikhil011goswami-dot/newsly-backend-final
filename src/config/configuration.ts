export default () => ({
  app: {
    nodeEnv:     process.env.NODE_ENV      || 'development',
    port:        parseInt(process.env.PORT || '3000', 10),
    name:        process.env.APP_NAME      || 'Newsly',
    apiVersion:  process.env.API_VERSION   || 'v1',
    frontendUrl: process.env.FRONTEND_URL  || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS  || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host:     process.env.REDIS_HOST                       || 'localhost',
    port:     parseInt(process.env.REDIS_PORT   || '6379', 10),
    password: process.env.REDIS_PASSWORD                   || '',
    db:       parseInt(process.env.REDIS_DB     || '0',    10),
    ttl:      parseInt(process.env.REDIS_TTL    || '3600', 10),
  },
  jwt: {
    accessSecret:    process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN  || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || 'com.newsly.app',
  },
  email: {
    host:     process.env.SMTP_HOST     || 'smtp.gmail.com',
    port:     parseInt(process.env.SMTP_PORT || '587', 10),
    user:     process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from:     process.env.SMTP_FROM     || 'noreply@newsly.app',
  },
  aws: {
    region:              process.env.AWS_REGION                  || 'ap-south-1',
    accessKeyId:         process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:     process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName:        process.env.AWS_S3_BUCKET_NAME,
    cloudFrontDomain:    process.env.AWS_CLOUDFRONT_DOMAIN,
    cloudFrontKeyPairId: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
    cloudFrontPrivateKey: process.env.AWS_CLOUDFRONT_PRIVATE_KEY,
  },
  firebase: {
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  openai: {
    apiKey:    process.env.OPENAI_API_KEY,
    model:     process.env.OPENAI_MODEL      || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048', 10),
  },
  throttle: {
    ttl:   parseInt(process.env.THROTTLE_TTL   || '60',  10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  logging: {
    level:                process.env.LOG_LEVEL             || 'debug',
    cloudWatchLogGroup:   process.env.CLOUDWATCH_LOG_GROUP  || '/newsly/backend',
    cloudWatchLogStream:  process.env.CLOUDWATCH_LOG_STREAM || 'app-logs',
  },
  bull: {
    redis: {
      host:     process.env.BULL_REDIS_HOST     || 'localhost',
      port:     parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
      password: process.env.BULL_REDIS_PASSWORD || '',
    },
  },
});
