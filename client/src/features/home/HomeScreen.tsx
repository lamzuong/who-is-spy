import { useState } from 'react';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from '../../lib/avatars';

interface HomeScreenProps {
  connecting: boolean;
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (name: string, roomCode: string, avatar: string) => void;
}

type Mode = 'choice' | 'create' | 'join';

interface IdentityFieldsProps {
  playerName: string;
  onPlayerNameChange: (value: string) => void;
  avatar: string;
  onAvatarChange: (value: string) => void;
}

function IdentityFields({
  playerName,
  onPlayerNameChange,
  avatar,
  onAvatarChange,
}: IdentityFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Your name</span>
        <div className="flex items-stretch gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl"
            aria-hidden
          >
            {avatar}
          </div>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-night"
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Taylor"
            maxLength={20}
            autoFocus
          />
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Pick an avatar</span>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_OPTIONS.map((option) => {
            const isSelected = option === avatar;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onAvatarChange(option)}
                aria-pressed={isSelected}
                aria-label={`Choose avatar ${option}`}
                className={`flex h-12 items-center justify-center rounded-2xl border text-2xl transition ${
                  isSelected
                    ? 'border-night bg-night text-white shadow-panel'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HomeScreen({ connecting, onCreateRoom, onJoinRoom }: HomeScreenProps) {
  const [mode, setMode] = useState<Mode>('choice');
  const [playerName, setPlayerName] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [roomCode, setRoomCode] = useState('');

  const resetToChoice = () => {
    setMode('choice');
    setPlayerName('');
    setAvatar(DEFAULT_AVATAR);
    setRoomCode('');
  };

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

      {mode === 'choice' ? (
        <Panel
          title="Join the party"
          subtitle="Create a new room or join an existing one."
          className="animate-fadeUp"
        >
          <div className="space-y-4">
            <Button fullWidth disabled={connecting} onClick={() => setMode('create')}>
              Create room
            </Button>

            <div className="relative py-2 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
              <span className="bg-white px-3">or</span>
            </div>

            <Button
              fullWidth
              variant="secondary"
              disabled={connecting}
              onClick={() => setMode('join')}
            >
              Join room
            </Button>
          </div>
        </Panel>
      ) : null}

      {mode === 'create' ? (
        <Panel
          title="Create a room"
          subtitle="Pick a display name and avatar your friends will recognize."
          className="animate-fadeUp"
        >
          <div className="space-y-4">
            <IdentityFields
              playerName={playerName}
              onPlayerNameChange={setPlayerName}
              avatar={avatar}
              onAvatarChange={setAvatar}
            />

            <Button
              fullWidth
              disabled={connecting}
              onClick={() => onCreateRoom(playerName, avatar)}
            >
              Create room
            </Button>

            <Button fullWidth variant="ghost" onClick={resetToChoice}>
              Back
            </Button>
          </div>
        </Panel>
      ) : null}

      {mode === 'join' ? (
        <Panel
          title="Join a room"
          subtitle="Enter your name, pick an avatar, and add the 5-character room code."
          className="animate-fadeUp"
        >
          <div className="space-y-4">
            <IdentityFields
              playerName={playerName}
              onPlayerNameChange={setPlayerName}
              avatar={avatar}
              onAvatarChange={setAvatar}
            />

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
              onClick={() => onJoinRoom(playerName, roomCode, avatar)}
            >
              Join room
            </Button>

            <Button fullWidth variant="ghost" onClick={resetToChoice}>
              Back
            </Button>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
