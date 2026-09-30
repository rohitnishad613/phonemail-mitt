import { api, apiMultipart } from '@/lib/api';

import type {
  Conversation,
  MailMessage,
} from './types';

export function getConversations() {
  return api<Conversation[]>(
    '/mail/conversations',
  );
}

export function getConversation(
  threadId: string,
) {
  return api<MailMessage[]>(
    `/mail/conversations/${encodeURIComponent(threadId)}`,
  );
}

export function markMessageRead(
  messageId: string,
) {
  return api(
    `/mail/${encodeURIComponent(messageId)}/read`,
    {
      method: 'PATCH',
    },
  );
}

export function deleteMessage(
  messageId: string,
) {
  return api(
    `/mail/${encodeURIComponent(messageId)}`,
    {
      method: 'DELETE',
    },
  );
}

export function sendMail(
  recipients: string[],
  subject: string,
  text: string,
  files: File[],
) {
  const form = new FormData();

  recipients.forEach((recipient) => {
    form.append('recipients[]', recipient);
  });

  if (subject.trim()) {
    form.append('subject', subject.trim());
  }

  form.append('text', text);

  files.forEach((file) => {
    form.append('attachments[]', file);
  });

  return apiMultipart(
    '/mail/send',
    form,
  );
}

export function getAttachmentUrl(
  messageId: string,
  attachmentId: string,
) {
  const base =
    import.meta.env.VITE_API_URL ?? '';

  return `${base}/api/v1/mail/${messageId}/attachments/${attachmentId}`;
}