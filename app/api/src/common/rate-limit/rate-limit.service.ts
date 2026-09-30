import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';

@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const client = this.redis.getClient();

    const created = await client.set(key, '1', {
      NX: true,
      EX: windowSeconds,
    });

    let count = 1;

    if (created !== 'OK') {
      count = await client.incr(key);
    }

    if (count > limit) {
      const ttl = await client.ttl(key);

      throw new HttpException(
        {
          message: 'Too many requests. Try again later.',
          retryAfterSeconds: Math.max(ttl, 1),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}