import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import type { ChatMessage, PrivateRoundInfo } from '../../types/game';

interface ChatPanelProps {
  messages: ChatMessage[];
  privateInfo: PrivateRoundInfo | null;
  canSend: boolean;
  isHost: boolean;
  isCurrentSpeaker: boolean;
  onSendMessage: (message: string) => void;
}

const MAX_LENGTH = 240;

function getDisabledReason(isHost: boolean, isCurrentSpeaker: boolean): string {
  if (isHost) {
    return '';
  }
  if (isCurrentSpeaker) {
    return '';
  }
  return 'Wait for your turn to chat.';
}

export function ChatPanel({
  messages,
  privateInfo,
  canSend,
  isHost,
  isCurrentSpeaker,
  onSendMessage,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const secretWord = privateInfo?.word?.trim().toLowerCase() ?? '';
  const disabledReason = getDisabledReason(isHost, isCurrentSpeaker);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    if (secretWord && trimmed.toLowerCase().includes(secretWord)) {
      setInlineError('Your message cannot include your secret word.');
      return;
    }

    setInlineError(null);
    onSendMessage(trimmed);
    setDraft('');
  };

  return (
    <Panel
      title="Discussion"
      subtitle="Describe without revealing your secret word."
      action={
        isHost ? (
          <Badge tone="accent">Host can chat anytime</Badge>
        ) : isCurrentSpeaker ? (
          <Badge tone="warning">Your turn</Badge>
        ) : (
          <Badge tone="neutral">Waiting for your turn</Badge>
        )
      }
    >
      <div
        ref={scrollRef}
        className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet. The current speaker kicks things off.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {message.avatar}
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {message.playerName}
                </p>
                <p className="text-sm text-night">{message.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (inlineError) {
              setInlineError(null);
            }
          }}
          placeholder={
            canSend ? 'Share a clue...' : disabledReason || 'Chat unavailable right now.'
          }
          maxLength={MAX_LENGTH}
          disabled={!canSend}
        />
        {inlineError ? (
          <p className="text-xs text-rose-600">{inlineError}</p>
        ) : disabledReason && !canSend ? (
          <p className="text-xs text-slate-500">{disabledReason}</p>
        ) : null}
        <Button type="submit" fullWidth disabled={!canSend || !draft.trim()}>
          Send
        </Button>
      </form>
    </Panel>
  );
}
