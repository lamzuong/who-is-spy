export type GamePhase = 'lobby' | 'speaking' | 'voting' | 'result';
export type WinnerSide = 'civilians' | 'spy' | null;
export type Role = 'civilian' | 'spy';

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  score: number;
}

export interface PublicRoundState {
  roundNumber: number;
  phase: GamePhase;
  speakingOrder: string[];
  currentTurnIndex: number;
  currentTurnPlayerId: string | null;
  votesReceived: number;
  totalEligibleVoters: number;
  revealedSpyId: string | null;
  winnerSide: WinnerSide;
}

export interface PublicRoomState {
  code: string;
  hostPlayerId: string;
  createdAt: number;
  updatedAt: number;
  canStartGame: boolean;
  players: PublicPlayer[];
  round: PublicRoundState;
}

export interface PrivateRoundInfo {
  playerId: string;
  role: Role;
  word: string | null;
}

export interface VoteBreakdownItem {
  playerId: string;
  playerName: string;
  votes: number;
}
