import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly client;

  constructor(private readonly config: ConfigService) {
    this.client = twilio(
      this.config.getOrThrow<string>('twilio.apiKey'),
      this.config.getOrThrow<string>('twilio.apiSecret'),
      {
        accountSid:
          this.config.getOrThrow<string>('twilio.accountSid'),
      },
    );
  }

  async sendOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<void> {

    await this.client.verify.v2
      .services(this.config.getOrThrow<string>(
        'twilio.verifyServiceSid',
      )).verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<boolean> {
    const verificationCheck =
      await this.client.verify.v2
        .services(this.config.getOrThrow<string>(
          'twilio.verifyServiceSid',
        )).verificationChecks.create({
          to: phoneNumber,
          code: otp,
        });

    return verificationCheck.status === 'approved';
  }
  
}