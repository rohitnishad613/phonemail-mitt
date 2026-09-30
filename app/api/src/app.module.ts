import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';

import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { RateLimitModule } from './common/rate-limit/rate-limit.module.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { HealthController } from './health/health.controller.js';
import mailConfig from './config/mail.config.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();


@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // We aren't using congiguration values here because ObserveModule is initialized before ConfigModule.
    // If you want to use configuration values, you can use ObserveModule.forRootAsync() instead.
    ObserveModule.forRoot({
      appKey: process.env.NUST_OBSERVE_API_KEY ?? '',
      appSecret: process.env.NUST_OBSERVE_API_SECRET ?? '',
      serviceId: 'phonemail-api',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration, mailConfig],
      validate: validateEnv,
      envFilePath: '.env',
    }),

    PrismaModule,
    RedisModule,
    
    CryptoModule,
    RateLimitModule,

    AuthModule,
    UsersModule,
    MailModule
  ],
  controllers: [HealthController],
})
export class AppModule {}
