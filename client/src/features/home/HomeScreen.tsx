import { useState } from 'react';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';

interface HomeScreenProps {
  connecting: boolean;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
}

export function HomeScreen({ connecting, onCreateRoom, onJoinRoom }: HomeScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="animate-fadeUp rounded-[2rem] bg-night p-8 text-white shadow-panel">
        <div className="max-w-xl">
          <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-aqua">
            Party deduction game
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            One room. One spy. Zero obvious clues.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Create a room, bring everyone into the lobby, reveal secret words, take turns
            describing, and vote before the spy slips away.
          </p>
        </div>
      </div>

      <Panel
        title="Join the party"
        subtitle="Use a display name. Room codes are 5 characters."
        className="animate-fadeUp"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Your name</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Taylor"
              maxLength={20}
            />
          </label>

          <Button fullWidth disabled={connecting} onClick={() => onCreateRoom(playerName)}>
            Create room
          </Button>

          <div className="relative py-2 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="bg-white px-3">or</span>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Room code</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase outline-none transition focus:border-night"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="A1B2C"
              maxLength={5}
            />
          </label>

          <Button
            fullWidth
            variant="secondary"
            disabled={connecting}
            onClick={() => onJoinRoom(playerName, roomCode)}
          >
            Join room
          </Button>
        </div>
      </Panel>
    </div>
  );
}
