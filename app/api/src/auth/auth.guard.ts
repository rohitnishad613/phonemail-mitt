import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { SessionService } from './session.service.js';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionToken: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const cookieName = this.sessions.getCookieName();

    const token = request.cookies?.[cookieName];

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException();
    }

    const session = await this.sessions.get(token);

    if (!session) {
      throw new UnauthorizedException();
    }

    await this.sessions.touch(token);

    request.auth = {
      userId: session.userId,
      sessionToken: token,
    };

    return true;
  }
}