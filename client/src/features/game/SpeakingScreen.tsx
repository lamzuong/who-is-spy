import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { PlayerList } from '../../components/PlayerList';
import type { PrivateRoundInfo, PublicRoomState } from '../../types/game';
import { SecretWordCard } from './SecretWordCard';

interface SpeakingScreenProps {
  room: PublicRoomState;
  playerId: string;
  privateInfo: PrivateRoundInfo | null;
  onNextTurn: () => void;
}

export function SpeakingScreen({
  room,
  playerId,
  privateInfo,
  onNextTurn,
}: SpeakingScreenProps) {
  const currentPlayer = room.players.find(
    (player) => player.id === room.round.currentTurnPlayerId
  );
  const isHost = room.hostPlayerId === playerId;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <SecretWordCard privateInfo={privateInfo} />

        <Panel
          title="Turn status"
          subtitle="Descriptions only. No saying the exact word."
          action={<Badge tone="warning">Round {room.round.roundNumber}</Badge>}
        >
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current speaker</p>
            <h3 className="mt-2 text-3xl font-semibold text-night">
              {currentPlayer?.name || 'Waiting'}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Turn {room.round.currentTurnIndex + 1} of {room.round.speakingOrder.length}
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        title="Speaking order"
        subtitle="Advance the turn after the current player finishes."
        action={isHost ? <Badge tone="accent">Host control</Badge> : null}
      >
        <PlayerList
          players={room.players}
          currentTurnPlayerId={room.round.currentTurnPlayerId}
        />
        <div className="mt-5">
          <Button fullWidth disabled={!isHost} onClick={onNextTurn}>
            Next turn
          </Button>
        </div>
      </Panel>
    </div>
  );
}
