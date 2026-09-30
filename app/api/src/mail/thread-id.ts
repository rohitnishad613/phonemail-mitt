import { createHash } from 'crypto';

export function createThreadId(
  mailboxAddress: string,
  otherAddress: string,
): string {
  const participants = [
    mailboxAddress.trim().toLowerCase(),
    otherAddress.trim().toLowerCase(),
  ].sort();

  return createHash('sha256')
    .update(participants.join(':'))
    .digest('hex');
}