import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  domain: process.env.MAIL_DOMAIN,

  smtpHost: 'postfix',
  smtpPort: Number(process.env.MAIL_SMTP_PORT),

  attachmentDirectory:
    process.env.MAIL_ATTACHMENT_DIRECTORY,

  maxAttachmentSize:
    Number(process.env.MAIL_MAX_ATTACHMENT_SIZE),

  maxAttachments:
    Number(process.env.MAIL_MAX_ATTACHMENTS),

  maxMessageSize:
    Number(process.env.MAIL_MAX_MESSAGE_SIZE),
  
  ingestSecret: process.env.MAIL_INGEST_SECRET,
}));