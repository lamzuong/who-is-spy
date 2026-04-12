import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { PlayerList } from '../../components/PlayerList';
import type { PublicRoomState } from '../../types/game';

interface LobbyScreenProps {
  room: PublicRoomState;
  playerId: string;
  onStartGame: () => void;
}

export function LobbyScreen({ room, playerId, onStartGame }: LobbyScreenProps) {
  const isHost = room.hostPlayerId === playerId;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel
        title={`Room ${room.code}`}
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
              ? 'Start when the room is ready.'
              : 'Only the host can begin the round.'
          }
        >
          <Button fullWidth disabled={!isHost || !room.canStartGame} onClick={onStartGame}>
            Start game
          </Button>
        </Panel>
      </div>
    </div>
  );
}
