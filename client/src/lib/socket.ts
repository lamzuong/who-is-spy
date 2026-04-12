import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : undefined);

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const SOCKET_EVENTS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  START_GAME: 'start_game',
  UPDATE_ROOM_SETTINGS: 'update_room_settings',
  NEXT_TURN: 'next_turn',
  SUBMIT_VOTE: 'submit_vote',
  NEXT_ROUND: 'next_round',
  LEAVE_ROOM: 'leave_room',
  ROOM_STATE: 'room_state',
  GAME_STARTED: 'game_started',
  PRIVATE_WORD: 'private_word',
  TURN_CHANGED: 'turn_changed',
  VOTING_STARTED: 'voting_started',
  VOTE_UPDATE: 'vote_update',
  ROUND_RESULT: 'round_result',
  ERROR_MESSAGE: 'error_message',
} as const;
