import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import { MailService } from './mail.service.js';
import { SendMailDto } from './dto/send-mail.dto.js';

@Controller('mail')
@UseGuards(AuthGuard)
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('send')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      limits: {
        files: 5,
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async send(
    @CurrentAuth()
    auth: { userId: string },

    @Body() body: SendMailDto,

    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    if (!body.text?.trim()) {
      throw new BadRequestException('Message body is required.');
    }

    return this.mail.send(auth.userId, {
      sender: '',
      recipients: body.recipients,
      subject: body.subject,
      text: body.text,
      attachments: files ?? [],
    });
  }

  @Get('conversations')
  async getConversations(@CurrentAuth() auth: { userId: string }) {
    return this.mail.getConversations(auth.userId);
  }

  @Get('conversations/:threadId')
  async getConversation(
    @CurrentAuth() auth: { userId: string },
    @Param('threadId') threadId: string,
  ) {
    return this.mail.getConversation(auth.userId, threadId);
  }

  @Get(':id')
  async get(
    @CurrentAuth()
    auth: { userId: string },
    @Param('id')
    id: string,
  ) {
    return this.mail.get(auth.userId, id);
  }

  @Patch(':id/read')
  async markRead(
    @CurrentAuth()
    auth: { userId: string },

    @Param('id')
    id: string,
  ) {
    return this.mail.markRead(auth.userId, id);
  }

  @Delete(':id')
  async delete(
    @CurrentAuth()
    auth: { userId: string },

    @Param('id')
    id: string,
  ) {
    return this.mail.delete(auth.userId, id);
  }

  @Get(':messageId/attachments/:attachmentId')
  async downloadAttachment(
    @CurrentAuth()
    auth: { userId: string },

    @Param('messageId')
    messageId: string,

    @Param('attachmentId')
    attachmentId: string,

    @Res()
    response: Response,
  ) {
    const attachment = await this.mail.downloadAttachment(
      auth.userId,
      messageId,
      attachmentId,
    );

    response.setHeader('Content-Type', attachment.contentType);

    response.setHeader('Content-Length', attachment.buffer.length.toString());

    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
    );

    response.setHeader('X-Content-Type-Options', 'nosniff');

    response.send(attachment.buffer);
  }
}
