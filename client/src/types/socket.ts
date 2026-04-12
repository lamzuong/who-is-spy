import type { PrivateRoundInfo, PublicRoomState, VoteBreakdownItem, WinnerSide } from './game';

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

export interface VoteUpdateEvent {
  votesReceived: number;
  totalEligibleVoters: number;
}

export interface RoundResultEvent {
  spyPlayerId: string | null;
  winnerSide: WinnerSide;
  voteBreakdown: VoteBreakdownItem[];
}

export interface AppState {
  playerId: string | null;
  playerName: string;
  room: PublicRoomState | null;
  privateInfo: PrivateRoundInfo | null;
  result: RoundResultEvent | null;
  toast: string | null;
  connected: boolean;
}
