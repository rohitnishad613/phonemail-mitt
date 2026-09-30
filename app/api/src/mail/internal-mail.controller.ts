import {
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  Req,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';

import type { Request } from 'express';

import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

@Controller('internal/mail')
export class InternalMailController {
  private readonly secret: string;

  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.secret =
      this.config.getOrThrow<string>(
        'mail.ingestSecret',
      );
  }

  @Post('ingest')
  @HttpCode(204)
  async ingest(
    @Headers('x-mail-ingest-secret')
    secret: string,

    @Req()
    request: RawBodyRequest<Request>,
  ): Promise<void> {
    if (
      !secret ||
      secret !== this.secret
    ) {
      throw new UnauthorizedException();
    } 

    const raw = request.rawBody;

    if (!raw || raw.length === 0) {
      throw new UnauthorizedException();
    }

    await this.mail.ingestIncomingMail(
      raw,
    );
  }
}