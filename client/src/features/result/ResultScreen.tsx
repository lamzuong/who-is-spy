import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import type { PrivateRoundInfo, PublicRoomState } from '../../types/game';
import type { RoundResultEvent } from '../../types/socket';

interface ResultScreenProps {
  room: PublicRoomState;
  playerId: string;
  privateInfo: PrivateRoundInfo | null;
  result: RoundResultEvent | null;
  onNextRound: () => void;
}

export function ResultScreen({
  room,
  playerId,
  privateInfo,
  result,
  onNextRound,
}: ResultScreenProps) {
  const isHost = room.hostPlayerId === playerId;
  const spyPlayer = room.players.find((player) => player.id === result?.spyPlayerId);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel
        title={result?.winnerSide === 'civilians' ? 'Spy caught' : 'Spy escaped'}
        subtitle={
          result?.winnerSide === 'civilians'
            ? 'The room found the spy before the round ended.'
            : 'The vote missed or tied, so the spy wins this round.'
        }
        action={
          <Badge tone={result?.winnerSide === 'civilians' ? 'accent' : 'danger'}>
            {result?.winnerSide === 'civilians' ? 'Civilians win' : 'Spy wins'}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="rounded-3xl bg-night px-6 py-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Spy revealed</p>
            <h3 className="mt-2 text-3xl font-semibold">{spyPlayer?.name || 'Unknown'}</h3>
            <p className="mt-2 text-sm text-slate-300">
              Your role was {privateInfo?.role || 'unknown'} with the word{' '}
              <span className="font-semibold text-aqua">{privateInfo?.word || 'n/a'}</span>.
            </p>
          </div>

          <Button fullWidth disabled={!isHost} onClick={onNextRound}>
            Play next round
          </Button>
        </div>
      </Panel>

      <Panel title="Vote breakdown" subtitle="Scores persist across rounds in this room.">
        <div className="space-y-3">
          {result?.voteBreakdown.map((item) => (
            <div
              key={item.playerId}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-night">{item.playerName}</p>
                <p className="text-sm text-slate-500">
                  Score: {room.players.find((player) => player.id === item.playerId)?.score || 0}
                </p>
              </div>
              <Badge tone="neutral">{item.votes} votes</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
