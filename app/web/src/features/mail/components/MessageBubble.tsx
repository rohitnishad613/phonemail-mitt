import {
  Check,
  CheckCheck,
  Download,
  FileText,
} from 'lucide-react';

import type { MailMessage } from '../types';
import { getAttachmentUrl } from '../api';

interface Props {
  message: MailMessage;
}

export function MessageBubble({
  message,
}: Props) {
  const outgoing =
    message.direction === 'OUTGOING';

  return (
    <div
      className={`
        flex w-full
        ${outgoing ? 'justify-end' : 'justify-start'}
      `}
    >
      <div
        className={`
          max-w-[88%] sm:max-w-[70%]
          rounded-2xl px-4 py-3
          shadow-sm
          ${
            outgoing
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-muted/70 text-foreground'
          }
        `}
      >
        {!outgoing && (
          <p className="mb-2 text-xs font-semibold text-primary">
            {message.sender}
          </p>
        )}

        {message.subject && (
          <p className="mb-2 text-sm font-semibold">
            {message.subject}
          </p>
        )}

        {message.textBody && (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-6">
            {message.textBody}
          </p>
        )}

        {message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map(
              (attachment) => (
                <a
                  key={attachment.id}
                  href={getAttachmentUrl(
                    message.id,
                    attachment.id,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={`
                    flex items-center gap-3
                    rounded-xl border
                    px-3 py-2
                    ${
                      outgoing
                        ? 'border-white/20 bg-white/10'
                        : 'border-border bg-white'
                    }
                  `}
                >
                  <FileText className="h-5 w-5 shrink-0" />

                  <span className="min-w-0 flex-1 truncate text-sm">
                    {attachment.originalName}
                  </span>

                  <Download className="h-4 w-4 shrink-0" />
                </a>
              ),
            )}
          </div>
        )}

        <div
          className={`
            mt-2 flex items-center justify-end gap-1
            text-[11px]
            ${
              outgoing
                ? 'text-white/75'
                : 'text-muted-foreground'
            }
          `}
        >
          {formatTime(
            message.sentAt ??
              message.receivedAt,
          )}

          {outgoing &&
            (message.isRead ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    [],
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  );
}