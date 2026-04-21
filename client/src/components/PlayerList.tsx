import type { PublicPlayer } from '../types/game';
import { Badge } from './Badge';

interface PlayerListProps {
  players: PublicPlayer[];
  currentTurnPlayerId?: string | null;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (playerId: string) => void;
  disabled?: boolean;
  showScores?: boolean;
}

export function PlayerList({
  players,
  currentTurnPlayerId = null,
  selectedPlayerId = null,
  onSelectPlayer,
  disabled = false,
  showScores = true,
}: PlayerListProps) {
  return (
    <div className="space-y-3">
      {players.map((player) => {
        const isClickable = Boolean(onSelectPlayer) && !disabled;
        const isSelected = selectedPlayerId === player.id;
        const isCurrent = currentTurnPlayerId === player.id;

        return (
          <button
            key={player.id}
            type="button"
            disabled={!isClickable}
            onClick={() => onSelectPlayer?.(player.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              isSelected
                ? 'border-night bg-night text-white'
                : 'border-slate-200 bg-white text-night hover:border-slate-300'
            } ${!isClickable ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
                aria-hidden
              >
                {player.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{player.name}</span>
                  {player.isHost ? <Badge tone="accent">Host</Badge> : null}
                  {!player.connected ? <Badge tone="danger">Offline</Badge> : null}
                  {isCurrent ? <Badge tone="warning">Speaking</Badge> : null}
                </div>
                {showScores ? (
                  <p className="text-sm text-slate-500">Score: {player.score}</p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
