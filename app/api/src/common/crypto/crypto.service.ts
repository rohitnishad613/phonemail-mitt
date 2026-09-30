import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly authPepper: Buffer;

  constructor(private readonly config: ConfigService) {
    this.authPepper = Buffer.from(
      this.config.getOrThrow<string>('auth.pepper'),
      'base64',
    );

    if (this.authPepper.length !== 32) {
      throw new Error('AUTH_PEPPER must decode to exactly 32 bytes');
    }
  }

  hmac(value: string): string {
    return createHmac('sha256', this.authPepper)
      .update(value, 'utf8')
      .digest('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256')
      .update(token, 'utf8')
      .digest('hex');
  }

  safeEqual(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'hex');
    const bBuffer = Buffer.from(b, 'hex');

    if (aBuffer.length !== bBuffer.length) {
      return false;
    }

    return timingSafeEqual(aBuffer, bBuffer);
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv(
      'aes-256-gcm',
      this.authPepper,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(payload: string): string {
    const [ivEncoded, authTagEncoded, encryptedEncoded] =
      payload.split('.');

    if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
      throw new Error('Invalid encrypted value');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.authPepper,
      Buffer.from(ivEncoded, 'base64url'),
    );

    decipher.setAuthTag(
      Buffer.from(authTagEncoded, 'base64url'),
    );

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}