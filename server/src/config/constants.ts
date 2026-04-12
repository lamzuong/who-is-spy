import type { GamePhase } from '../types/game.js';

export const GAME_PHASES: Record<string, GamePhase> = {
  LOBBY: 'lobby',
  SPEAKING: 'speaking',
  VOTING: 'voting',
  RESULT: 'result',
};

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
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

export const MIN_PLAYERS_TO_START = 3;
export const ROOM_CODE_LENGTH = 5;
