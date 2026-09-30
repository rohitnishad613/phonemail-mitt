import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { AttachmentsService } from '../attachments/attachments.service.js';
import { randomUUID } from 'crypto';
import nodemailer, { type Transporter } from 'nodemailer';
import { simpleParser, ParsedMail } from 'mailparser';
import type { SendMailInput } from './mail.types.js';
import { createThreadId } from './thread-id.js';

@Injectable()
export class MailService {
  private readonly domain: string;
  private readonly maxAttachments: number;

  private readonly transporter: Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly attachments: AttachmentsService,
    private readonly config: ConfigService,
  ) {
    this.domain = this.config.getOrThrow<string>('mail.domain');

    this.maxAttachments = this.config.getOrThrow<number>('mail.maxAttachments');

    const host = this.config.getOrThrow<string>('mail.smtpHost');

    const port = this.config.getOrThrow<number>('mail.smtpPort');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // Leave false for port 587 / 25
      requireTLS: false,
      ignoreTLS: true, // Prevents Nodemailer from trying to upgrade via STARTTLS
      tls: {
        rejectUnauthorized: false, // Allows self-signed or invalid certificates if TLS is used
      },
    });
  }

  async send(userId: string, input: SendMailInput) {
    const mailbox = await this.prisma.mailbox.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        address: input.sender,
      },
      update: {},
    });

    if (!mailbox) {
      throw new NotFoundException('Mailbox not found.');
    }

    const recipients = this.normalizeRecipients(input.recipients);

    if (recipients.length === 0) {
      throw new BadRequestException('At least one recipient is required.');
    }

    if (input.attachments && input.attachments.length > this.maxAttachments) {
      throw new BadRequestException(
        `Maximum ${this.maxAttachments} attachments are allowed.`,
      );
    }

    const messageId = `<${randomUUID()}@${this.domain}>`;

    const storedAttachments = [];

    try {
      for (const file of input.attachments ?? []) {
        const stored = await this.attachments.store(file);

        storedAttachments.push(stored);
      }

      const totalAttachmentSize = storedAttachments.reduce(
        (sum, attachment) => sum + attachment.sizeBytes,
        0,
      );

      const totalSize =
        Buffer.byteLength(input.text, 'utf8') +
        Buffer.byteLength(input.subject ?? '', 'utf8') +
        totalAttachmentSize;

      const threadId = createThreadId(
        mailbox.address,
        recipients[0],
      );
      const message = await this.prisma.message.create({
        data: {
          mailboxId: mailbox.id,
          messageId,
          threadId,

          direction: 'OUTGOING',

          sender: mailbox.address,
          recipients,

          subject: input.subject?.trim() || null,
          textBody: input.text,

          sizeBytes: totalSize,

          receivedAt: new Date(),
          sentAt: new Date(),

          isRead: true,

          attachments: {
            create: storedAttachments.map((attachment) => ({
              originalName: attachment.originalName,
              storedName: attachment.storedName,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              sha256: attachment.sha256,
              scanStatus: 'PENDING',
            })),
          },
        },
        include: {
          attachments: true,
        },
      });

      await this.transporter.sendMail({
        envelope: {
          from: mailbox.address,
          to: recipients,
        },

        from: mailbox.address,
        to: recipients,

        subject: input.subject?.trim() || '(no subject)',

        text: input.text,

        messageId,

        attachments: storedAttachments.map((attachment) => ({
          filename: attachment.originalName,
          path: this.getAttachmentPath(attachment.storedName),
          contentType: attachment.contentType,
        })),
      });

      return this.toMessageResponse(message);
    } catch (error) {
      /*
       * Database and filesystem cleanup is important.
       * We do not leave orphaned attachments behind
       * when mail creation/delivery fails.
       */

      for (const attachment of storedAttachments) {
        await this.attachments.remove(attachment.storedName);
      }

      throw error;
    }
  }

  async getConversations(userId: string) {
    const mailbox = await this.getMailbox(userId);

    if (!mailbox) {
      return [];
    }

    const result = await this.prisma.message.aggregateRaw({
      pipeline: [
        {
          $match: {
            mailboxId: {
              $oid: mailbox.id,
            },
            isDeleted: false,
          },
        },

        {
          $sort: {
            receivedAt: -1,
          },
        },

        {
          $group: {
            _id: '$threadId',

            latest: {
              $first: '$$ROOT',
            },

            unreadCount: {
              $sum: {
                $cond: [{ $eq: ['$isRead', false] }, 1, 0],
              },
            },

            messageCount: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            threadId: '$_id',

            unreadCount: 1,

            messageCount: 1,

            latest: {
              id: {
                $toString: '$latest._id',
              },

              messageId: '$latest.messageId',
              threadId: '$latest.threadId',
              direction: '$latest.direction',
              sender: '$latest.sender',
              recipients: '$latest.recipients',
              subject: '$latest.subject',
              textBody: '$latest.textBody',
              receivedAt: '$latest.receivedAt',
              sentAt: '$latest.sentAt',
            },
          },
        },

        {
          $sort: {
            'latest.receivedAt': -1,
          },
        },

        {
          $limit: 50,
        },
      ],
    });

    return result;
  }

  async getConversation(userId: string, threadId: string) {
    const mailbox = await this.getMailbox(userId);

    if (!mailbox) {
      return [];
    }

    const messages = await this.prisma.message.findMany({
      where: {
        mailboxId: mailbox.id,
        threadId,
        isDeleted: false,
      },

      include: {
        attachments: true,
      },

      orderBy: {
        receivedAt: 'asc',
      },
    });

    return messages;
  }

  async get(userId: string, messageId: string) {
    const mailbox = await this.getMailbox(userId);

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        mailboxId: mailbox.id,
        isDeleted: false,
      },
      include: {
        attachments: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    return this.toMessageResponse(message);
  }

  async markRead(userId: string, messageId: string) {
    const mailbox = await this.getMailbox(userId);

    const message = await this.prisma.message.updateMany({
      where: {
        id: messageId,
        mailboxId: mailbox.id,
        isDeleted: false,
      },
      data: {
        isRead: true,
      },
    });

    if (message.count === 0) {
      throw new NotFoundException('Message not found.');
    }

    return {
      success: true,
    };
  }

  async delete(userId: string, messageId: string) {
    const mailbox = await this.getMailbox(userId);

    const message = await this.prisma.message.updateMany({
      where: {
        id: messageId,
        mailboxId: mailbox.id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });

    if (message.count === 0) {
      throw new NotFoundException('Message not found.');
    }

    return {
      success: true,
    };
  }

  async downloadAttachment(
    userId: string,
    messageId: string,
    attachmentId: string,
  ) {
    const mailbox = await this.getMailbox(userId);

    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        messageId,
        message: {
          mailboxId: mailbox.id,
          isDeleted: false,
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    if (attachment.scanStatus !== 'CLEAN') {
      throw new BadRequestException('Attachment is not available.');
    }

    const buffer = await this.attachments.read(attachment.storedName);

    return {
      buffer,
      filename: attachment.originalName,
      contentType: attachment.contentType,
    };
  }

  /**
   * Called by the inbound-mail worker after
   * Postfix receives an email.
   */
  async ingestIncomingMail(rawMessage: Buffer) {
    const parsed = await simpleParser(rawMessage);

    const recipients = this.extractRecipients(parsed);

    if (recipients.length === 0) {
      throw new BadRequestException('Incoming message has no recipient.');
    }

    const recipient = recipients.find((address) =>
      address.endsWith(`@${this.domain}`),
    );

    if (!recipient) {
      throw new BadRequestException('Recipient is not a PhoneMail address.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        emailAddress: recipient,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const mailbox = await this.prisma.mailbox.upsert({
      where: {
        address: recipient,
      },
      create: {
        userId: user.id,
        address: recipient,
      },
      update: {},
    });

    if (!mailbox) {
      throw new NotFoundException('Mailbox does not exist.');
    }

    const messageId = `<${randomUUID()}@${this.domain}>`;

    const threadId = createThreadId(
      mailbox.address,
      recipient,
    );

    const storedAttachments = [];

    try {
      for (const attachment of parsed.attachments) {
        const file = this.parsedAttachmentToFile(attachment);

        const stored = await this.attachments.store(file);

        storedAttachments.push(stored);
      }

      const message = await this.prisma.message.create({
        data: {
          mailboxId: mailbox.id,

          messageId,
          threadId,

          direction: 'INCOMING',

          sender: this.extractSender(parsed),

          recipients,

          subject: parsed.subject?.trim() || null,

          textBody: parsed.text?.trim() || null,

          htmlBody: typeof parsed.html === 'string' ? parsed.html : null,

          sizeBytes: rawMessage.byteLength,

          receivedAt: parsed.date ?? new Date(),

          isRead: false,

          attachments: {
            create: storedAttachments.map((attachment) => ({
              originalName: attachment.originalName,
              storedName: attachment.storedName,
              contentType: attachment.contentType,
              sizeBytes: attachment.sizeBytes,
              sha256: attachment.sha256,
              scanStatus: 'CLEAN',
            })),
          },
        },

        include: {
          attachments: true,
        },
      });

      return this.toMessageResponse(message);
    } catch (error) {
      console.error('Error ingesting incoming mail:', error);
      for (const attachment of storedAttachments) {
        await this.attachments.remove(attachment.storedName);
      }

      throw error;
    }
  }

  private async getMailbox(userId: string) {
    // get email address of user from userId and ensure mailbox exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const mailbox = await this.prisma.mailbox.upsert({
      where: {
        address: user.emailAddress,
      },
      create: {
        userId,
        address: user.emailAddress,
      },
      update: {},
    });

    if (!mailbox) {
      throw new NotFoundException('Mailbox not found.');
    }

    return mailbox;
  }

  private normalizeRecipients(recipients: string[]): string[] {
    return [
      ...new Set(
        recipients.map((value) => value.trim().toLowerCase()).filter(Boolean),
      ),
    ];
  }

  private extractRecipients(parsed: ParsedMail): string[] {
    const addresses = [
      ...(parsed.to ? this.extractAddressList(parsed.to) : []),

      ...(parsed.cc ? this.extractAddressList(parsed.cc) : []),
    ];

    return [...new Set(addresses.map((address) => address.toLowerCase()))];
  }

  private extractAddressList(field: NonNullable<ParsedMail['to']>): string[] {
    if ('value' in field) {
      return field.value
        .map((item) => item.address)
        .filter((address): address is string => Boolean(address));
    }

    return [];
  }

  private extractSender(parsed: ParsedMail): string {
    const sender = parsed.from?.value?.[0]?.address;

    if (!sender) {
      return 'unknown@unknown';
    }

    return sender.toLowerCase();
  }

  private parsedAttachmentToFile(
    attachment: ParsedMail['attachments'][number],
  ): Express.Multer.File {
    return {
      fieldname: 'attachment',
      originalname: attachment.filename ?? 'attachment',
      encoding: '7bit',
      mimetype: attachment.contentType || 'application/octet-stream',
      size: attachment.size,
      buffer: attachment.content,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as never,
    };
  }

  private getAttachmentPath(storedName: string): string {
    const directory = this.config.getOrThrow<string>(
      'mail.attachmentDirectory',
    );

    return `${directory}/${storedName}`;
  }

  private toMessageResponse(message: any) {
    return {
      id: message.id,
      threadId: message.threadId,
      direction: message.direction,
      sender: message.sender,
      recipients: message.recipients,
      subject: message.subject,
      textBody: message.textBody,
      htmlBody: message.htmlBody,
      receivedAt: message.receivedAt,
      sentAt: message.sentAt,
      isRead: message.isRead,
      attachments:
        message.attachments?.map((attachment: any) => ({
          id: attachment.id,
          originalName: attachment.originalName,
          contentType: attachment.contentType,
          sizeBytes: attachment.sizeBytes,
          scanStatus: attachment.scanStatus,
        })) ?? [],
    };
  }

  private createPreview(text: string | null): string {
    if (!text) {
      return '';
    }

    return text.replace(/\s+/g, ' ').trim().slice(0, 160);
  }
}
