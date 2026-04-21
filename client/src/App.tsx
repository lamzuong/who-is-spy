import { useEffect, useState } from 'react';
import { Badge } from './components/Badge';
import { Button } from './components/Button';
import { HomeScreen } from './features/home/HomeScreen';
import { SpeakingScreen } from './features/game/SpeakingScreen';
import { LobbyScreen } from './features/lobby/LobbyScreen';
import { ResultScreen } from './features/result/ResultScreen';
import { VotingScreen } from './features/voting/VotingScreen';
import { SOCKET_EVENTS, socket } from './lib/socket';
import type { PrivateRoundInfo, PublicRoomState, RoundSettings } from './types/game';
import type {
  AppState,
  GameStartedEvent,
  RoomStateEvent,
  RoundResultEvent,
  VoteUpdateEvent,
} from './types/socket';

const initialState: AppState = {
  playerId: null,
  playerName: '',
  room: null,
  privateInfo: null,
  result: null,
  toast: null,
  connected: false,
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      setState((current) => ({ ...current, connected: true }));
    };

    const handleDisconnect = () => {
      setState((current) => ({ ...current, connected: false }));
    };

    const handleRoomState = ({ room, playerId }: RoomStateEvent) => {
      setState((current) => ({
        ...current,
        room,
        playerId: playerId || current.playerId,
        result: room.round.phase === 'result' ? current.result : null,
      }));
    };

    const handlePrivateWord = (privateInfo: PrivateRoundInfo) => {
      setState((current) => ({ ...current, privateInfo }));
    };

    const handleResult = (result: RoundResultEvent) => {
      setState((current) => ({ ...current, result }));
    };

    const handleVoteUpdate = ({ votesReceived, totalEligibleVoters }: VoteUpdateEvent) => {
      setState((current) => {
        if (!current.room) {
          return current;
        }

        return {
          ...current,
          room: {
            ...current.room,
            round: {
              ...current.room.round,
              votesReceived,
              totalEligibleVoters,
            },
          },
        };
      });
    };

    const handlePhaseStart = ({ phase }: GameStartedEvent) => {
      setState((current) => ({
        ...current,
        result: null,
        toast: phase === 'speaking' ? 'Round started. Keep your word secret.' : current.toast,
      }));
    };

    const handleError = ({ message }: { message: string }) => {
      setState((current) => ({ ...current, toast: message }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.PRIVATE_WORD, handlePrivateWord);
    socket.on(SOCKET_EVENTS.ROUND_RESULT, handleResult);
    socket.on(SOCKET_EVENTS.VOTE_UPDATE, handleVoteUpdate);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handlePhaseStart);
    socket.on(SOCKET_EVENTS.ERROR_MESSAGE, handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.PRIVATE_WORD, handlePrivateWord);
      socket.off(SOCKET_EVENTS.ROUND_RESULT, handleResult);
      socket.off(SOCKET_EVENTS.VOTE_UPDATE, handleVoteUpdate);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handlePhaseStart);
      socket.off(SOCKET_EVENTS.ERROR_MESSAGE, handleError);
      socket.disconnect();
    };
  }, []);

  const updateToast = (message: string | null) => {
    setState((current) => ({ ...current, toast: message }));
  };

  const createRoom = (playerName: string, avatar: string) => {
    if (!playerName.trim()) {
      updateToast('Enter your name before creating a room.');
      return;
    }

    setState((current) => ({ ...current, playerName }));
    socket.emit(SOCKET_EVENTS.CREATE_ROOM, { playerName, avatar });
  };

  const joinRoom = (playerName: string, roomCode: string, avatar: string) => {
    if (!playerName.trim() || !roomCode.trim()) {
      updateToast('Enter both your name and a room code.');
      return;
    }

    setState((current) => ({ ...current, playerName }));
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { playerName, roomCode, avatar });
  };

  const startGame = () => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.START_GAME, { roomCode: state.room.code });
    }
  };

  const updateRoomSettings = (settings: RoundSettings) => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.UPDATE_ROOM_SETTINGS, {
        roomCode: state.room.code,
        settings,
      });
    }
  };

  const nextTurn = () => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.NEXT_TURN, { roomCode: state.room.code });
    }
  };

  const sendChatMessage = (message: string) => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.SEND_CHAT_MESSAGE, {
        roomCode: state.room.code,
        message,
      });
    }
  };

  const submitVote = (targetPlayerId: string) => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.SUBMIT_VOTE, {
        roomCode: state.room.code,
        targetPlayerId,
      });
    }
  };

  const nextRound = () => {
    if (state.room) {
      setState((current) => ({ ...current, result: null }));
      socket.emit(SOCKET_EVENTS.NEXT_ROUND, { roomCode: state.room.code });
    }
  };

  const leaveRoom = () => {
    if (state.room) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: state.room.code });
    }

    setState(initialState);
  };

  const room: PublicRoomState | null = state.room;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-night">Who is the Spy</h1>
            <Badge tone={state.connected ? 'accent' : 'danger'}>
              {state.connected ? 'Live' : 'Offline'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time social deduction for 3+ players.
          </p>
        </div>

        {room ? (
          <Button variant="ghost" onClick={leaveRoom}>
            Leave
          </Button>
        ) : null}
      </header>

      {state.toast ? (
        <div className="mb-6 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-rose-700">
          {state.toast}
        </div>
      ) : null}

      <main className="flex-1">
        {!room ? (
          <HomeScreen connecting={!state.connected} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
        ) : null}

        {room?.round.phase === 'lobby' ? (
          <LobbyScreen
            room={room}
            playerId={state.playerId || ''}
            onStartGame={startGame}
            onUpdateSettings={updateRoomSettings}
          />
        ) : null}

        {room?.round.phase === 'speaking' ? (
          <SpeakingScreen
            room={room}
            playerId={state.playerId || ''}
            privateInfo={state.privateInfo}
            onNextTurn={nextTurn}
            onSendChatMessage={sendChatMessage}
          />
        ) : null}

        {room?.round.phase === 'voting' ? (
          <VotingScreen
            room={room}
            playerId={state.playerId || ''}
            onSubmitVote={submitVote}
          />
        ) : null}

        {room?.round.phase === 'result' ? (
          <ResultScreen
            room={room}
            playerId={state.playerId || ''}
            privateInfo={state.privateInfo}
            result={state.result}
            onNextRound={nextRound}
          />
        ) : null}
      </main>
    </div>
  );
}
