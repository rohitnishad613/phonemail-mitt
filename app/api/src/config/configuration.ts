export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',

  port: Number(process.env.PORT ?? 3000),

  webUrl: process.env.WEB_URL,

  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? 'v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  auth: {
    pepper: process.env.AUTH_PEPPER,

    otp: {
      length: Number(process.env.OTP_LENGTH ?? 6),
      ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
      maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
      resendCooldownSeconds: Number(
        process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60,
      ),
    },

    session: {
      ttlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 2592000),
      cookieName: process.env.SESSION_COOKIE_NAME ?? 'session',
      cookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    },
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    apiKey: process.env.TWILIO_API_KEY,
    apiSecret: process.env.TWILIO_API_SECRET,
    authToken: process.env.TWILIO_API_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },

  mail: {
    domain: process.env.MAIL_DOMAIN,
    smtpHost: process.env.MAIL_SMTP_HOST,
    smtpPort: process.env.MAIL_SMTP_PORT,
    attachmentDirectory: process.env.MAIL_ATTACHMENT_DIRECTORY,
    maxAttachmentSize: process.env.MAIL_MAX_ATTACHMENT_SIZE,
    maxAttachments: process.env.MAIL_MAX_ATTACHMENTS,
    maxMessageSize: process.env.MAIL_MAX_MESSAGE_SIZE,
    ingestSecret: process.env.MAIL_INGEST_SECRET,
  }
});