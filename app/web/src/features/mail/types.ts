export interface MailListItem {
  id: string;
  messageId: string;
  threadId: string;
  direction: MessageDirection;
  sender: string;
  recipients: string[];
  subject: string | null;
  textBody: string | null;
  sizeBytes: number;
  receivedAt: string;
  sentAt: string | null;
  isRead: boolean;
  attachments: Attachment[];
}

export interface MailListResponse {
  items: MailListItem[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}


export type MessageDirection =
  | 'INCOMING'
  | 'OUTGOING';

export interface Attachment {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus:
    | 'PENDING'
    | 'CLEAN'
    | 'INFECTED'
    | 'FAILED';
}

export interface MailMessage {
  id: string;
  messageId: string;
  threadId: string;

  direction: MessageDirection;

  sender: string;
  recipients: string[];

  subject: string | null;

  textBody: string | null;
  htmlBody?: string | null;

  sizeBytes: number;

  receivedAt: string;
  sentAt: string | null;

  isRead: boolean;
  isDeleted?: boolean;

  createdAt?: string;
  updatedAt?: string;

  attachments: Attachment[];
}

export interface Conversation {
  threadId: string;

  unreadCount: number;
  messageCount: number;

  latest: {
    id: string;
    messageId: string;
    threadId: string;

    direction: MessageDirection;

    sender: string;
    recipients: string[];

    subject: string | null;
    textBody: string | null;

    receivedAt: string;
    sentAt: string | null;
  };
}