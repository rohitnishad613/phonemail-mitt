import type { Conversation } from '../types';

interface Props {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  selected,
  onClick,
}: Props) {
  const latest = conversation.latest;

  const name =
    latest.direction === 'INCOMING'
      ? latest.sender
      : latest.recipients[0] ?? 'Sent';

  const preview =
    latest.textBody?.replace(/\s+/g, ' ').trim() ||
    latest.subject ||
    'No message';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        mb-2 flex w-full items-center gap-3
        rounded-2xl border p-3 text-left
        transition
        ${
          selected
            ? 'border-primary/20 bg-primary/5'
            : 'border-border bg-white hover:bg-muted/40'
        }
      `}
    >
      <div
        className="
          flex h-12 w-12 shrink-0
          items-center justify-center
          rounded-full bg-primary/10
          text-sm font-semibold text-primary
        "
      >
        {getInitials(name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`
              min-w-0 flex-1 truncate text-[15px]
              ${
                conversation.unreadCount
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-foreground'
              }
            `}
          >
            {name}
          </p>

        </div>

        <div className="mt-1 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {preview}
          </p>

          {conversation.unreadCount > 0 && (
            <span
              className="
                flex h-6 min-w-6 shrink-0
                items-center justify-center
                rounded-full bg-primary
                px-1.5 text-xs font-semibold
                text-white
              "
            >
              {conversation.unreadCount}
            </span>
          )}
        </div>

        {latest.subject && (
          <p className="mt-1 truncate text-xs text-muted-foreground/80">
            {latest.subject}
          </p>
        )}
      </div>
    </button>
  );
}

function getInitials(value: string) {
  const clean = value
    .split('@')[0]
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim();

  if (!clean) return '?';

  const parts = clean.split(/\s+/);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
