import {
  useEffect,
  useState,
} from 'react';

import {
  ConversationList,
} from '../components/ConversationList';

import {
  ConversationView,
} from '../components/ConversationView';

import {
  getConversation,
  getConversations,
  markMessageRead,
  sendMail,
} from '../api';

import type {
  Conversation,
  MailMessage,
} from '../types';
import { FullMailComposer } from '../components/FullMailComposer';
import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';

interface Props {
  currentEmail: string;
}

export function MailPage({
  currentEmail,
}: Props) {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [
    selectedThreadId,
    setSelectedThreadId,
  ] = useState<string | null>(null);

  const [messages, setMessages] =
    useState<MailMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [composeOpen, setComposeOpen] =
    useState(false);

  const [
    conversationLoading,
    setConversationLoading,
  ] = useState(false);

  async function loadConversations() {
    const data =
      await getConversations();

    setConversations(data);
  }

  useEffect(() => {
    void loadConversations().finally(() =>
      setLoading(false),
    );
  }, []);

  async function openConversation(
    threadId: string,
  ) {
    setSelectedThreadId(threadId);
    setConversationLoading(true);

    try {
      const data =
        await getConversation(threadId);

      setMessages(data);

      await Promise.all(
        data
          .filter(
            (message) =>
              !message.isRead &&
              message.direction ===
                'INCOMING',
          )
          .map((message) =>
            markMessageRead(message.id),
          ),
      );

      setConversations((current) =>
        current.map((conversation) =>
          conversation.threadId === threadId
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation,
        ),
      );
    } finally {
      setConversationLoading(false);
    }
  }

  async function handleSend(
    recipients: string[],
    subject: string,
    text: string,
    files: File[],
  ) {
    await sendMail(
      recipients,
      subject,
      text,
      files,
    );

    await loadConversations();

    if (selectedThreadId) {
      const data =
        await getConversation(
          selectedThreadId,
        );

      setMessages(data);
    }
  }

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.threadId ===
        selectedThreadId,
    );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="
        flex h-full
        overflow-hidden
        bg-muted/30
      "
    >
      <div
        className={`
          h-full w-full
          md:w-[380px]
          md:shrink-0
          md:border-r
          ${
            selectedThreadId
              ? 'hidden md:block'
              : 'block'
          }
        `}
      >
        <ConversationList
          conversations={conversations}
          selectedThreadId={
            selectedThreadId
          }
          onSelect={
            openConversation
          }
        />
        <Button
            className="fixed bottom-4 right-4 z-10 p-4"
            size="lg"
            onClick={() =>
              setComposeOpen(true)
            }
          >
            <PenLine />
        </Button>
      </div>

      <div
        className={`
          h-full min-w-0 flex-1
          ${
            selectedThreadId
              ? 'block'
              : 'hidden md:block'
          }
        `}
      >
        {selectedConversation ? (
          conversationLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <ConversationView
              conversation={
                selectedConversation
              }
              messages={messages}
              currentEmail={
                currentEmail
              }
              onBack={() =>
                setSelectedThreadId(null)
              }
              onSend={handleSend}
            />
          )
        ) : (
          <EmptyMailState />
        )}

        {composeOpen && (
          <FullMailComposer
            onClose={() =>
              setComposeOpen(false)
            }
            onSent={loadConversations}
          />
        )}
      </div>
    </div>
  );
}

function EmptyMailState() {
  return (
    <div className="flex h-full items-center justify-center bg-muted/20 p-6">
      <div className="text-center">
        <div
          className="
            mx-auto mb-4 flex h-16 w-16
            items-center justify-center
            rounded-full bg-primary/10
            text-primary
          "
        >
          <span className="text-2xl">
            ✉
          </span>
        </div>

        <h2 className="text-lg font-semibold">
          Your messages
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Select a conversation to open it.
        </p>
      </div>
    </div>
  );
}