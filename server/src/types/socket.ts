import type { PrivateRoundInfo, PublicRoomState, VoteBreakdownItem, WinnerSide } from './game.js';

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  playerName: string;
  roomCode: string;
}

export interface RoomActionPayload {
  roomCode: string;
}

export interface UpdateRoomSettingsPayload extends RoomActionPayload {
  settings: {
    civilianWord?: string;
    spyWord?: string;
    spyCount?: number | null;
  };
}

export interface VotePayload extends RoomActionPayload {
  targetPlayerId: string;
}

export interface RoomStateEvent {
  room: PublicRoomState;
  playerId?: string;
}

export interface GameStartedEvent {
  phase: PublicRoomState['round']['phase'];
  roundNumber: number;
  speakingOrder: string[];
  currentTurnPlayerId: string | null;
}

export interface TurnChangedEvent {
  currentTurnPlayerId: string | null;
  currentTurnIndex: number;
}

export interface VoteUpdateEvent {
  votesReceived: number;
  totalEligibleVoters: number;
}

export interface RoundResultEvent {
  spyPlayerIds: string[];
  winnerSide: WinnerSide;
  voteBreakdown: VoteBreakdownItem[];
}

export interface ErrorMessageEvent {
  message: string;
}

export type PrivateWordEvent = PrivateRoundInfo;
