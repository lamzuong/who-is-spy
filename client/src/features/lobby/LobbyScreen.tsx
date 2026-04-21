import { useEffect, useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { PlayerList } from '../../components/PlayerList';
import { CATEGORY_OPTIONS } from '../../lib/categories';
import type { PublicRoomState, RoundSettings } from '../../types/game';

interface LobbyScreenProps {
  room: PublicRoomState;
  playerId: string;
  onStartGame: () => void;
  onUpdateSettings: (settings: RoundSettings) => void;
}

function getMaxSpyCount(playerCount: number): number {
  return Math.max(1, Math.min(playerCount - 2, Math.floor(playerCount / 3) || 1));
}

export function LobbyScreen({
  room,
  playerId,
  onStartGame,
  onUpdateSettings,
}: LobbyScreenProps) {
  const isHost = room.hostPlayerId === playerId;
  const [settings, setSettings] = useState<RoundSettings>(room.settings);
  const [codeCopied, setCodeCopied] = useState(false);
  const maxSpyCount = getMaxSpyCount(room.players.filter((player) => player.connected).length);

  useEffect(() => {
    setSettings(room.settings);
  }, [room.settings]);

  const updateSettings = (nextSettings: RoundSettings) => {
    setSettings(nextSettings);
    onUpdateSettings(nextSettings);
  };

  const copyRoomCode = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(room.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      // silent — clipboard access denied
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <span>Room {room.code}</span>
            <button
              type="button"
              onClick={copyRoomCode}
              aria-label={codeCopied ? 'Room code copied' : 'Copy room code'}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-night transition hover:bg-slate-50"
            >
              {codeCopied ? '✓' : 'Copy'}
            </button>
          </span>
        }
        subtitle="Wait for at least 3 players. The host controls the start."
        action={
          <Badge tone={room.canStartGame ? 'accent' : 'warning'}>
            {room.players.length} players
          </Badge>
        }
      >
        <PlayerList players={room.players} />
      </Panel>

      <div className="space-y-6">
        <Panel title="How this round works">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Everyone except the spy receives the same word.</p>
            <p>The spy gets a related word, then tries to blend in during descriptions.</p>
            <p>After everyone speaks, the room votes once to reveal the spy.</p>
          </div>
        </Panel>

        <Panel
          title={isHost ? 'Host controls' : 'Waiting for host'}
          subtitle={
            isHost
              ? 'Optional round settings are applied before the game starts.'
              : 'Only the host can begin the round.'
          }
        >
          {isHost ? (
            <div className="mb-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
                  value={settings.category ?? ''}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      category: event.target.value || null,
                    })
                  }
                >
                  <option value="">Random (any category)</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Ignored when you supply custom civilian and spy words below.
                </p>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Civilian word
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
                  value={settings.civilianWord}
                  onChange={(event) =>
                    updateSettings({ ...settings, civilianWord: event.target.value })
                  }
                  placeholder="Leave blank to use a random pair"
                  maxLength={30}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Spy word
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
                  value={settings.spyWord}
                  onChange={(event) =>
                    updateSettings({ ...settings, spyWord: event.target.value })
                  }
                  placeholder="Related to the civilian word"
                  maxLength={30}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Number of spies
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
                  type="number"
                  min={1}
                  max={maxSpyCount}
                  value={settings.spyCount ?? ''}
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      spyCount: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  placeholder={`Default: 1 (max ${maxSpyCount})`}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Leave blank for the default. For {room.players.length} players, the safe max is{' '}
                  {maxSpyCount}.
                </p>
              </label>
            </div>
          ) : null}

          <Button fullWidth disabled={!isHost || !room.canStartGame} onClick={onStartGame}>
            Start game
          </Button>
        </Panel>
      </div>
    </div>
  );
}
