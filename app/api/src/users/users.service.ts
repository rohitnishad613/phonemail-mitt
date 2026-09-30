import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service.js';
import { CryptoService } from '../common/crypto/crypto.service.js';
//import { MailService } from '../mail/mail.service.js';
import { normalizeIndianPhone } from '../common/phone/phone.util.js';

export interface SafeUser {
  id: string;
  emailAddress: string;
  isActive: boolean;
  phoneVerifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    //private readonly mailService: MailService,
    private readonly crypto: CryptoService,
  ) {}

  async findByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: {
        phoneNumber,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createFromVerifiedPhone(
    phoneNumber: string,
    phoneE164: string,
    nationalNumber: string,
  ) {
    const emailAddress = `${phoneNumber}@phonemail.tech`;

    try {
      // use function 'ensureMailbox' of mail service to create mailbox for user after user creation
      const user = await this.prisma.user.create({
        data: {
          phoneNumber,
          emailAddress,
          phoneVerifiedAt: new Date(),
        },
      });
      // await this.mailService.ensureMailbox(user.id, user.emailAddress);

      return user;
      
    } catch (error) {
      // Handles the race where two OTP verifications
      // for the same phone happen simultaneously.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findByPhone(phoneNumber);

        if (existing) {
          return existing;
        }
      }

      throw new InternalServerErrorException(
        'Unable to create account',
      );
    }
  }

  async markLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  toSafeUser(user: {
    id: string;
    emailAddress: string;
    isActive: boolean;
    phoneVerifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      emailAddress: user.emailAddress,
      isActive: user.isActive,
      phoneVerifiedAt: user.phoneVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}