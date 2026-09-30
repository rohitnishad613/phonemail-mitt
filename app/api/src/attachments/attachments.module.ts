import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service.js';

@Module({
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}