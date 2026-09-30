import { Paperclip, Download } from 'lucide-react';
import type { Attachment } from '../types';
import { getAttachmentUrl } from '../api';

interface Props {
  messageId: string;
  attachments: Attachment[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  messageId,
  attachments,
}: Props) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {attachments.map((attachment) => {
        const url = getAttachmentUrl(
          messageId,
          attachment.id,
        );

        return (
          <a
            key={attachment.id}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted"
          >
            <Paperclip className="h-4 w-4 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {attachment.originalName}
              </p>

              <p className="text-xs text-muted-foreground">
                {formatSize(attachment.sizeBytes)}
              </p>
            </div>

            <Download className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}