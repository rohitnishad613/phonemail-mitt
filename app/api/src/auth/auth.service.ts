import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  randomInt,
} from 'node:crypto';

import { CryptoService } from '../common/crypto/crypto.service.js';
import { normalizeIndianPhone } from '../common/phone/phone.util.js';
import { RateLimitService } from '../common/rate-limit/rate-limit.service.js';
import { RedisService } from '../redis/redis.service.js';
import { UsersService } from '../users/users.service.js';
import { SessionService } from './session.service.js';
import { TwilioService } from './twilio.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
    private readonly rateLimit: RateLimitService,
    private readonly users: UsersService,
    private readonly sessions: SessionService,
    private readonly twilio: TwilioService,
  ) {}

  async requestOtp(
    rawPhoneNumber: string,
    ip: string,
  ) {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);

    /*
     * IP-level protection.
     *
     * 20 OTP requests / hour / IP.
     */
    await this.rateLimit.consume(
      `rl:otp:start:ip:${ip}`,
      20,
      60 * 60,
    );

    /*
     * Phone-level protection.
     *
     * 3 OTP requests / 10 minutes / phone.
     */
    await this.rateLimit.consume(
      `rl:otp:start:phone:${phoneNumber}`,
      3,
      60 * 10,
    );

    const cooldownKey =
      `otp:cooldown:${phoneNumber}`;

    const cooldownCreated = await this.redis
      .getClient()
      .set(
        cooldownKey,
        '1',
        {
          NX: true,
          EX: this.config.getOrThrow<number>(
            'auth.otp.resendCooldownSeconds',
          ),
        },
      );

    if (cooldownCreated !== 'OK') {
      throw new UnauthorizedException(
        'Please wait before requesting another OTP.',
      );
    }

    const otpLength = this.config.getOrThrow<number>(
      'auth.otp.length',
    );

    const min = 10 ** (otpLength - 1);
    const max = 10 ** otpLength;

    const otp = randomInt(min, max)
      .toString()
      .padStart(otpLength, '0');

    try {
      /*
       * Send SMS first.
       *
       * We don't want to store an OTP if Twilio failed.
       */
      await this.twilio.sendOtp(
        phoneNumber.e164,
        otp,
      );

      const ttl = this.config.getOrThrow<number>(
        'auth.otp.ttlSeconds',
      );

      return {
        message:
          'If this number can be verified, a verification code has been sent.',
        expiresInSeconds: ttl,
      };
    } catch (error) {
      await this.redis
        .getClient()
        .del(cooldownKey);

      throw error;
    }
  }

  async verifyOtp(
    rawPhoneNumber: string,
    otp: string,
    ip: string,
  ) {
    const phoneNumber = normalizeIndianPhone(rawPhoneNumber);

    await this.rateLimit.consume(
      `rl:otp:verify:ip:${ip}`,
      50,
      60 * 10,
    );

    await this.rateLimit.consume(
      `rl:otp:verify:phone:${phoneNumber}`,
      10,
      60 * 10,
    );

    const valid =
    await this.twilio.verifyOtp(
      phoneNumber.e164,
      otp,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid or expired OTP.',
      );
    }

    /*
     * Find existing account.
     * If it doesn't exist, create it.
     */
    let user =
      await this.users.findByPhone(
        phoneNumber.nationalNumber,
      );

    const isNewUser = !user;

    if (!user) {
      user =
        await this.users.createFromVerifiedPhone(
          phoneNumber.nationalNumber,
          phoneNumber.e164,
          phoneNumber.nationalNumber,
        );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'This account is not active.',
      );
    }

    await this.users.markLogin(user.id);

    const sessionToken =
      await this.sessions.create(user.id);

    return {
      sessionToken,
      isNewUser,
      user: this.users.toSafeUser(user),
    };
  }
}