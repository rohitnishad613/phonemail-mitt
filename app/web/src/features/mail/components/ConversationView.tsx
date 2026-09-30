import {
  ArrowLeft,
  UserRound,
} from 'lucide-react';

import {
  Button,
} from '@/components/ui/button';

import type {
  Conversation,
  MailMessage,
} from '../types';

import { MessageBubble } from './MessageBubble';
import { MailComposer } from './MailComposer';

interface Props {
  conversation: Conversation;
  messages: MailMessage[];
  currentEmail: string;
  onBack: () => void;
  onSend: (
    recipients: string[],
    subject: string,
    text: string,
    files: File[],
  ) => Promise<void>;
}

export function ConversationView({
  conversation,
  messages,
  currentEmail,
  onBack,
  onSend,
}: Props) {
  const latest = conversation.latest;

  const correspondent =
    latest.direction === 'INCOMING'
      ? latest.sender
      : latest.recipients[0] ?? 'Conversation';

  return (
    <section className="flex h-full min-h-[70dvh] min-h-0 flex-col bg-white">
      <header
        className="
          flex h-[76px] shrink-0
          items-center gap-3
          border-b bg-primary
          px-3 text-white
          sm:px-5
        "
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft />
        </Button>

        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-full bg-white/15
          "
        >
          <UserRound className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">
            {correspondent}
          </h2>

          <p className="truncate text-xs text-white/75">
            {conversation.messageCount}{' '}
            {conversation.messageCount === 1
              ? 'message'
              : 'messages'}
          </p>
        </div>
      </header>

      <div
        className="
          min-h-0 flex-1
          overflow-y-auto
          bg-white
          px-3 py-5
          sm:px-6
        "
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <DateDivider
            date={
              messages[0]?.receivedAt ??
              latest.receivedAt
            }
          />

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
        </div>
      </div>

      <MailComposer
        defaultRecipient={correspondent}
        currentEmail={currentEmail}
        onSend={onSend}
      />
    </section>
  );
}

function DateDivider({
  date,
}: {
  date: string;
}) {
  return (
    <div className="my-2 flex justify-center">
      <span
        className="
          rounded-full bg-muted
          px-4 py-1
          text-xs text-muted-foreground
        "
      >
        {new Date(date).toLocaleDateString(
          undefined,
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        )}
      </span>
    </div>
  );
}