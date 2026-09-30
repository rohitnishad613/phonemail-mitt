import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export interface NormalizedPhone {
  e164: string;
  nationalNumber: string;
  country: 'IN';
}

export function normalizeIndianPhone(
  input: string,
): NormalizedPhone {
  const phone = parsePhoneNumberFromString(input, 'IN');

  if (!phone || phone.country !== 'IN' || !phone.isValid()) {
    throw new BadRequestException(
      'Please enter a valid Indian mobile number.',
    );
  }

  const nationalNumber = phone.nationalNumber;

  if (!/^\d{10}$/.test(nationalNumber)) {
    throw new BadRequestException(
      'Please enter a valid 10-digit mobile number.',
    );
  }

  return {
    e164: phone.number,
    nationalNumber,
    country: 'IN',
  };
}