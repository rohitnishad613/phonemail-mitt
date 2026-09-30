import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { Response } from 'express';

import { RedisService } from '../redis/redis.service.js';
import { CryptoService } from '../common/crypto/crypto.service.js';

export interface SessionData {
  userId: string;
  createdAt: string;
  lastUsedAt: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly redis: RedisService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
  ) {}

  private get ttlSeconds() {
    return this.config.getOrThrow<number>(
      'auth.session.ttlSeconds',
    );
  }

  private get cookieName() {
    return this.config.getOrThrow<string>(
      'auth.session.cookieName',
    );
  }

  private get cookieSecure() {
    return this.config.getOrThrow<boolean>(
      'auth.session.cookieSecure',
    );
  }

  private key(token: string) {
    return `session:${this.crypto.hashToken(token)}`;
  }

  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');

    const now = new Date().toISOString();

    const data: SessionData = {
      userId,
      createdAt: now,
      lastUsedAt: now,
    };

    await this.redis
      .getClient()
      .set(
        this.key(token),
        JSON.stringify(data),
        {
          EX: this.ttlSeconds,
        },
      );

    return token;
  }

  async get(token: string): Promise<SessionData | null> {
    const value = await this.redis
      .getClient()
      .get(this.key(token));

    if (!value) {
      return null;
    }

    return JSON.parse(value) as SessionData;
  }

  async touch(token: string): Promise<void> {
    const key = this.key(token);
    const client = this.redis.getClient();

    const ttl = await client.ttl(key);

    if (ttl <= 0) {
      return;
    }

    // Renew when less than half of the session lifetime remains.
    if (ttl < this.ttlSeconds / 2) {
      const session = await this.get(token);

      if (!session) {
        return;
      }

      session.lastUsedAt = new Date().toISOString();

      await client.set(
        key,
        JSON.stringify(session),
        {
          EX: this.ttlSeconds,
        },
      );
    }
  }

  async destroy(token: string): Promise<void> {
    await this.redis.getClient().del(this.key(token));
  }

  setCookie(response: Response, token: string): void {
    response.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: this.ttlSeconds * 1000,
    });
  }

  clearCookie(response: Response): void {
    response.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
    });
  }

  getCookieName(): string {
    return this.cookieName;
  }
}