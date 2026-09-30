import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import type { Express } from 'express';

export interface StoredAttachment {
  originalName: string;
  storedName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
}

@Injectable()
export class AttachmentsService {
  private readonly directory: string;
  private readonly maxSize: number;

  private readonly allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]);

  constructor(private readonly config: ConfigService) {
    this.directory = this.config.getOrThrow<string>(
      'mail.attachmentDirectory',
    );

    this.maxSize = this.config.getOrThrow<number>(
      'mail.maxAttachmentSize',
    );
  }

  async initialize(): Promise<void> {
    await mkdir(this.directory, {
      recursive: true,
    });
  }

  async store(
    file: Express.Multer.File,
  ): Promise<StoredAttachment> {
    if (!file?.buffer) {
      throw new BadRequestException('Invalid attachment.');
    }

    if (file.size <= 0) {
      throw new BadRequestException('Attachment is empty.');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `Attachment exceeds the maximum size of ${this.maxSize} bytes.`,
      );
    }

    const detectedType = await fileTypeFromBuffer(file.buffer);

    const contentType =
      detectedType?.mime ??
      this.normalizeTextContentType(file.mimetype);

    if (!this.allowedTypes.has(contentType)) {
      throw new BadRequestException(
        'This attachment type is not supported.',
      );
    }

    const originalName = this.sanitizeFilename(file.originalname);

    const extension =
      detectedType?.ext
        ? `.${detectedType.ext}`
        : extname(originalName).toLowerCase();

    const storedName = `${randomUUID()}${extension}`;

    const hash = createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    await this.initialize();

    const destination = join(this.directory, storedName);

    await writeFile(destination, file.buffer, {
      flag: 'wx',
    });

    return {
      originalName,
      storedName,
      contentType,
      sizeBytes: file.size,
      sha256: hash,
    };
  }

  async read(storedName: string): Promise<Buffer> {
    if (!this.isSafeStoredName(storedName)) {
      throw new BadRequestException('Invalid attachment.');
    }

    try {
      return await readFile(join(this.directory, storedName));
    } catch {
      throw new NotFoundException('Attachment not found.');
    }
  }

  async remove(storedName: string): Promise<void> {
    if (!this.isSafeStoredName(storedName)) {
      return;
    }

    try {
      await unlink(join(this.directory, storedName));
    } catch {
      // File may already have been removed.
    }
  }

  private sanitizeFilename(filename: string): string {
    const name = basename(filename)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[<>:"/\\|?*]/g, '_')
      .trim();

    if (!name) {
      return 'attachment';
    }

    return name.slice(0, 255);
  }

  private isSafeStoredName(name: string): boolean {
    return (
      name.length > 0 &&
      name.length <= 255 &&
      name === basename(name) &&
      !name.includes('..') &&
      /^[a-zA-Z0-9._-]+$/.test(name)
    );
  }

  private normalizeTextContentType(
    type: string | undefined,
  ): string {
    if (
      type === 'text/plain' ||
      type === 'text/csv'
    ) {
      return type;
    }

    return 'application/octet-stream';
  }
}