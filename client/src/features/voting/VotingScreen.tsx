import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { PlayerList } from '../../components/PlayerList';
import type { PublicRoomState } from '../../types/game';

interface VotingScreenProps {
  room: PublicRoomState;
  playerId: string;
  onSubmitVote: (targetPlayerId: string) => void;
}

export function VotingScreen({ room, playerId, onSubmitVote }: VotingScreenProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const availablePlayers = useMemo(
    () => room.players.filter((player) => player.id !== playerId && player.connected),
    [room.players, playerId]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Panel
        title="Vote for the spy"
        subtitle="Each player gets one vote. You cannot vote for yourself."
        action={
          <Badge tone="warning">
            {room.round.votesReceived}/{room.round.totalEligibleVoters} votes
          </Badge>
        }
      >
        <PlayerList
          players={availablePlayers}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          showScores={false}
        />
        <div className="mt-5">
          <Button
            fullWidth
            disabled={!selectedPlayerId}
            onClick={() => selectedPlayerId && onSubmitVote(selectedPlayerId)}
          >
            Lock in vote
          </Button>
        </div>
      </Panel>

      <Panel title="Voting tips">
        <div className="space-y-3 text-sm leading-6 text-slate-600">
          <p>Focus on players whose clue felt too vague or slightly off-topic.</p>
          <p>Tied highest votes let the spy survive. That favors the spy side.</p>
          <p>Fast votes are risky. Look for patterns before committing.</p>
        </div>
      </Panel>
    </div>
  );
}
