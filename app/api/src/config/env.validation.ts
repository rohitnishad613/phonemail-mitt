import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  WEB_URL: z.string().url(),

  API_PREFIX: z.string().default('api'),
  API_VERSION: z.string().default('1'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  AUTH_PEPPER: z.string().min(1),

  OTP_LENGTH: z.coerce.number().int().min(6).max(8).default(6),

  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),

  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),

  OTP_RESEND_COOLDOWN_SECONDS: z.coerce
    .number()
    .int()
    .min(30)
    .max(300)
    .default(60),

  SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(86400)
    .max(31536000)
    .default(2592000),

  SESSION_COOKIE_NAME: z.string().default('session'),

  SESSION_COOKIE_SECURE: booleanString.default(false),

  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_API_KEY: z.string().min(1),
  TWILIO_API_SECRET: z.string().min(1),
  TWILIO_API_TOKEN: z.string().min(1),
  TWILIO_VERIFY_SERVICE_SID: z.string().min(1),

  MAIL_DOMAIN: z.string().min(1),
  MAIL_SMTP_HOST: z.string().min(1),
  MAIL_SMTP_PORT: z.string().min(1),
  MAIL_ATTACHMENT_DIRECTORY: z.string().min(1),
  MAIL_MAX_ATTACHMENT_SIZE: z.string().min(1),
  MAIL_MAX_ATTACHMENTS: z.string().min(1),
  MAIL_MAX_MESSAGE_SIZE: z.string().min(1),
  MAIL_INGEST_SECRET: z.string().min(1)
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
