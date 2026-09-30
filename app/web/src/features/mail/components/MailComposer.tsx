import {
  Paperclip,
  Send,
  X,
} from 'lucide-react';

import {
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  currentEmail: string;
  defaultRecipient: string;
  onSend: (
    recipients: string[],
    subject: string,
    text: string,
    files: File[],
  ) => Promise<void>;
}

export function MailComposer({
  currentEmail,
  defaultRecipient,
  onSend,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  async function submit() {
    const body = text.trim();

    if (!body || sending) {
      return;
    }

    setSending(true);

    try {
      await onSend(
        [defaultRecipient],
        'Reply to ' + defaultRecipient,
        body,
        files,
      );

      setText('');
      setFiles([]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="shrink-0 border-t bg-muted/40 p-3">
      <div className="mx-auto max-w-3xl">
        {files.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="
                  flex shrink-0 items-center gap-2
                  rounded-lg bg-white
                  px-3 py-2 text-xs
                  shadow-sm
                "
              >
                <Paperclip className="h-3.5 w-3.5" />

                <span className="max-w-32 truncate">
                  {file.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setFiles((current) =>
                      current.filter(
                        (_, i) => i !== index,
                      ),
                    )
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className="
            flex items-end gap-2
            rounded-3xl bg-white
            p-2 shadow-sm
          "
        >
          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full
              text-primary
              hover:bg-primary/10
            "
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              const selected = Array.from(
                event.target.files ?? [],
              );

              setFiles((current) => [
                ...current,
                ...selected,
              ]);

              event.target.value = '';
            }}
          />

          <Textarea
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder={`Message ${defaultRecipient}`}
            className="
              max-h-32 min-h-10 resize-none
              border-0 bg-transparent
              px-2 py-2
              shadow-none
              focus-visible:ring-0
            "
          />

          <Button
            type="button"
            size="icon"
            disabled={
              sending || !text.trim()
            }
            onClick={() => void submit()}
            className="
              h-10 w-10 shrink-0
              rounded-full
            "
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <p className="mt-1 px-3 text-[10px] text-muted-foreground">
          {currentEmail}
        </p>
      </div>
    </div>
  );
}