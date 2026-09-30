import {
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { NestFactory } from '@nestjs/core';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule, ObserveInstrument } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
    rawBody: true,
  });

  const config =
    app.get(ConfigService);

  app.useBodyParser('raw', {
    type: 'application/octet-stream',
    limit: process.env.MAX_MESSAGE_SIZE ?? '25mb',
  });

  /*
   * Needed when running behind Nginx/Caddy/Cloudflare
   * in production so request.ip is meaningful.
   */
  if (
    config.get<string>('nodeEnv') ===
    'production'
  ) {
    app
      .getHttpAdapter()
      .getInstance()
      .set('trust proxy', 1);
  }

  /*
   * Security headers.
   */
  app.use(helmet());

  /*
   * Parse cookies.
   */
  app.use(cookieParser());

  /*
   * CORS.
   *
   * Credentials are required because our authentication
   * is cookie-based.
   */
  app.enableCors({
    origin: config.getOrThrow<string>(
      'webUrl',
    ),
    credentials: true,
  });

  /*
   * API prefix.
   */
  const prefix = config.getOrThrow<string>('apiPrefix') + '/' + config.getOrThrow<string>('apiVersion');
  app.setGlobalPrefix(prefix);

  /*
   * URI API versioning.
   */
  app.enableVersioning({
    type: VersioningType.URI,
  });

  /*
   * DTO validation.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.getOrThrow<number>('port');

  await app.listen(port);

  console.log(
    `API running on http://localhost:${port}`,
  );
}

bootstrap();