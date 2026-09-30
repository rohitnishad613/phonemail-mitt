import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentAuth() auth: { userId: string }) {
    const user = await this.usersService.findById(auth.userId);

    return {
      user: this.usersService.toSafeUser(user),
    };
  }
}