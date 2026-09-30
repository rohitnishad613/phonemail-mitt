import { useRef, useState } from 'react';
import {
  Paperclip,
  Send,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { sendMail } from '../api';

interface Props {
  onSent: () => void;
  onClose: () => void;
}

export function FullMailComposer({
  onSent,
  onClose,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [recipients, setRecipients] =
    useState('');

  const [subject, setSubject] =
    useState('');

  const [text, setText] =
    useState('');

  const [files, setFiles] =
    useState<File[]>([]);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSend() {
    setError(null);

    const parsedRecipients = recipients
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!parsedRecipients.length) {
      setError('Enter at least one recipient.');
      return;
    }

    if (!text.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    try {
      setSending(true);

      await sendMail(
        parsedRecipients,
        subject,
        text,
        files,
      );

      setRecipients('');
      setSubject('');
      setText('');
      setFiles([]);

      onSent();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to send message.',
      );
    } finally {
      setSending(false);
    }
  }

  function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected = Array.from(
      event.target.files ?? [],
    );

    setFiles((current) => [
      ...current,
      ...selected,
    ]);

    event.target.value = '';
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/30 p-2 md:p-6">
      <div className="w-full max-w-2xl rounded-xl border bg-background shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold">
            New message
          </h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X />
          </Button>
        </header>

        <div className="space-y-3 p-4">
          <Input
            placeholder="Recipient"
            value={recipients}
            onChange={(event) =>
              setRecipients(event.target.value)
            }
          />

          <Input
            placeholder="Subject"
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
          />

          <Textarea
            placeholder="Write your message..."
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            className="min-h-48 resize-none"
          />

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
                >
                  <span className="truncate">
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
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFiles}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Paperclip />
              Attach
            </Button>

            <Button
              onClick={handleSend}
              disabled={sending}
            >
              <Send />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}