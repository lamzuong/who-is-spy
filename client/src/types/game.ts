export type GamePhase = 'lobby' | 'speaking' | 'voting' | 'result';
export type WinnerSide = 'civilians' | 'spy' | null;
export type Role = 'civilian' | 'spy';

export interface RoundSettings {
  civilianWord: string;
  spyWord: string;
  spyCount: number | null;
  category: string | null;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  message: string;
  timestamp: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  connected: boolean;
  score: number;
}

export interface PublicRoundState {
  roundNumber: number;
  phase: GamePhase;
  spyCount: number;
  speakingOrder: string[];
  currentTurnIndex: number;
  currentTurnPlayerId: string | null;
  votesReceived: number;
  totalEligibleVoters: number;
  revealedSpyIds: string[];
  winnerSide: WinnerSide;
  chatMessages: ChatMessage[];
}

export interface PublicRoomState {
  code: string;
  hostPlayerId: string;
  createdAt: number;
  updatedAt: number;
  canStartGame: boolean;
  settings: RoundSettings;
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
