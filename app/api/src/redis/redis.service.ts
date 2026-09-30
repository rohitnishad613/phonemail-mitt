import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;

  constructor(private readonly config: ConfigService) {
    this.client = createClient({
      url: this.config.getOrThrow<string>('redis.url'),
      socket: {
        // Automatically reconnect when the connection drops
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis connection retries exhausted');
          }
          // Exponential backoff: wait 100ms, 200ms, 400ms... up to 3 seconds
          return Math.min(100 * Math.pow(2, retries), 3000);
        },
        // Prevent the client from hanging indefinitely during connection issues
        connectTimeout: 10000
      }
    });

    this.client.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  getClient() {
    return this.client;
  }
}