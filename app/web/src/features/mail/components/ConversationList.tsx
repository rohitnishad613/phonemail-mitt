import { useMemo, useState } from 'react';
import {
  Paperclip,
  Search,
  Star,
} from 'lucide-react';

import { Input } from '@/components/ui/input';

import type { Conversation } from '../types';
import { ConversationListItem } from './ConversationListItem';

interface Props {
  conversations: Conversation[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
}

export function ConversationList({
  conversations,
  selectedThreadId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<'all' | 'unread' | 'attachments'>(
      'all',
    );

  const filtered = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return conversations.filter((conversation) => {
      const latest = conversation.latest;

      const correspondent =
        latest.direction === 'INCOMING'
          ? latest.sender
          : latest.recipients.join(', ');

      const matchesSearch =
        !query ||
        correspondent.toLowerCase().includes(query) ||
        latest.subject
          ?.toLowerCase()
          .includes(query) ||
        latest.textBody
          ?.toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' &&
          conversation.unreadCount > 0);

      return matchesSearch && matchesFilter;
    });
  }, [conversations, search, filter]);

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="px-4 pb-3 pt-4">
        <div className="relative">
          <Search
            className="
              absolute left-4 top-1/2
              h-4 w-4 -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search"
            className="
              h-11 rounded-full
              border-0 bg-muted/60
              pl-11
              focus-visible:ring-2
              focus-visible:ring-primary/30
            "
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>

          <FilterButton
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
          >
            Unread
          </FilterButton>

          <FilterButton
            active={filter === 'attachments'}
            onClick={() =>
              setFilter('attachments')
            }
          >
            <Paperclip className="h-4 w-4" />
            Attachments
          </FilterButton>

          <FilterButton
            active={false}
            onClick={() => {}}
          >
            <Star className="h-4 w-4" />
            Favourites
          </FilterButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationListItem
              key={conversation.threadId}
              conversation={conversation}
              selected={
                conversation.threadId ===
                selectedThreadId
              }
              onClick={() =>
                onSelect(conversation.threadId)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex h-10 shrink-0 items-center gap-1.5
        rounded-full border px-4 text-sm
        transition
        ${
          active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-white text-muted-foreground hover:bg-muted'
        }
      `}
    >
      {children}
    </button>
  );
}