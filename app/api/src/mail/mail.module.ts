import { Module } from '@nestjs/common';

import { AttachmentsModule } from '../attachments/attachments.module.js';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';
import { InternalMailController } from './internal-mail.controller.js';
import { SessionService } from '../auth/session.service.js';

@Module({
  imports: [
    AttachmentsModule,
  ],

  controllers: [
    MailController,
    InternalMailController
  ],

  providers: [
    MailService,
    SessionService
  ],

  exports: [
    MailService,
  ],
})
export class MailModule {}