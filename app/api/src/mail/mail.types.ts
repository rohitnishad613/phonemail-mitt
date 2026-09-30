export interface SendMailInput {
  sender: string;
  recipients: string[];
  subject?: string;
  text: string;
  attachments?: Express.Multer.File[];
}

export interface MailListItem {
  id: string;
  threadId: string;
  direction: string;
  sender: string;
  recipients: string[];
  subject: string | null;
  preview: string;
  receivedAt: Date;
  sentAt: Date | null;
  isRead: boolean;
  attachments: Array<{
    id: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  }>;
}