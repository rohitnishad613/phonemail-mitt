import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import { SessionService } from './session.service.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { CurrentAuth } from './current-auth.decorator.js';
import { AuthenticatedRequest } from './auth.guard.js';
import { AuthGuard } from './auth.guard.js';
import { UseGuards } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(
    @Body() dto: RequestOtpDto,
    @Req() request: Request,
  ) {
    return this.authService.requestOtp(
      dto.phoneNumber,
      request.ip!,
    );
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result =
      await this.authService.verifyOtp(
        dto.phoneNumber,
        dto.otp,
        request.ip!,
      );

    this.sessions.setCookie(
      response,
      result.sessionToken,
    );

    /*
     * Never return the session token in JSON.
     *
     * The browser receives it only as an HttpOnly cookie.
     */
    return {
      isNewUser: result.isNewUser,
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentAuth()
    auth: AuthenticatedRequest['auth'],
    @Res({ passthrough: true }) response: Response,
  ) {
    if (auth?.sessionToken) {
      await this.sessions.destroy(
        auth.sessionToken,
      );
    }

    this.sessions.clearCookie(response);
  }
}