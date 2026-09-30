import { Module, forwardRef } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SessionService } from './session.service.js';
import { TwilioService } from './twilio.service.js';

import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    forwardRef(() => UsersModule),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    SessionService,
    TwilioService,
    AuthGuard,
  ],
  exports: [
    AuthGuard,
    SessionService,
  ],
})
export class AuthModule {}