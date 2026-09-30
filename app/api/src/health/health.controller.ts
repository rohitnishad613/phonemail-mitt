import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async health() {
    try {
      await this.prisma.$runCommandRaw({
        ping: 1,
      });

      await this.redis.getClient().ping();

      return {
        status: 'ok',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
      });
    }
  }
}