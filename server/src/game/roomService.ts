import {
  GAME_PHASES,
  MIN_PLAYERS_TO_START,
  ROOM_CODE_LENGTH,
} from '../config/constants.js';
import { WORD_PAIRS } from './wordPairs.js';
import {
  bindSocketToPlayer,
  deleteRoom,
  getRoom,
  listRooms,
  saveRoom,
  unbindSocket,
} from '../store/roomStore.js';
import type {
  Player,
  PrivateRoundInfo,
  PublicRoomState,
  RoundSettings,
  Role,
  Room,
  RoundState,
  VoteBreakdownItem,
} from '../types/game.js';
import { generateId, generateRoomCode, pickRandom, shuffle } from '../utils/id.js';

function getDefaultRoomSettings(): RoundSettings {
  return {
    civilianWord: '',
    spyWord: '',
    spyCount: null,
  };
}

function createPlayer(input: {
  name: string;
  socketId: string;
  roomCode: string;
  isHost: boolean;
}): Player {
  return {
    id: generateId(),
    socketId: input.socketId,
    name: input.name,
    roomCode: input.roomCode,
    isHost: input.isHost,
    connected: true,
    score: 0,
  };
}

function createLobbyRound(previousRoundNumber = 0): RoundState {
  return {
    roundNumber: previousRoundNumber,
    phase: GAME_PHASES.LOBBY,
    spyPlayerIds: [],
    civilianWord: null,
    spyWord: null,
    spyCount: 1,
    speakingOrder: [],
    currentTurnIndex: -1,
    votes: [],
    revealedSpyIds: [],
    winnerSide: null,
  };
}

function getMaxSpyCount(playerCount: number): number {
  return Math.max(1, Math.min(playerCount - 2, Math.floor(playerCount / 3) || 1));
}

function normalizeRoundSettings(room: Room, input?: Partial<RoundSettings>): RoundSettings {
  const merged: RoundSettings = {
    civilianWord: input?.civilianWord?.trim() ?? room.settings.civilianWord,
    spyWord: input?.spyWord?.trim() ?? room.settings.spyWord,
    spyCount: input?.spyCount ?? room.settings.spyCount,
  };

  if ((merged.civilianWord && !merged.spyWord) || (!merged.civilianWord && merged.spyWord)) {
    throw new Error('Set both civilian and spy words together, or leave both empty.');
  }

  if (
    merged.civilianWord &&
    merged.spyWord &&
    merged.civilianWord.toLowerCase() === merged.spyWord.toLowerCase()
  ) {
    throw new Error('Civilian and spy words must be different.');
  }

  if (merged.spyCount !== null) {
    if (!Number.isInteger(merged.spyCount) || merged.spyCount < 1) {
      throw new Error('Spy count must be a whole number greater than 0.');
    }

    const maxSpyCount = getMaxSpyCount(getActivePlayers(room).length || room.players.length);
    if (merged.spyCount > maxSpyCount) {
      throw new Error(`Spy count is too high for this room. Maximum allowed is ${maxSpyCount}.`);
    }
  }

  return merged;
}

function ensureRoomExists(roomCode: string): Room {
  const room = getRoom(roomCode);

  if (!room) {
    throw new Error('Room not found.');
  }

  return room;
}

function ensurePlayer(room: Room, playerId: string | null): Player {
  if (!playerId) {
    throw new Error('Player session not found.');
  }

  const player = room.players.find((entry) => entry.id === playerId);

  if (!player) {
    throw new Error('Player not found.');
  }

  return player;
}

function ensureHost(room: Room, playerId: string | null): void {
  const player = ensurePlayer(room, playerId);

  if (!player.isHost) {
    throw new Error('Only the host can perform this action.');
  }
}

function getActivePlayers(room: Room): Player[] {
  return room.players.filter((player) => player.connected);
}

function getEligibleVoters(room: Room): Player[] {
  return getActivePlayers(room);
}

function buildVoteBreakdown(room: Room): VoteBreakdownItem[] {
  const tally = new Map<string, number>();

  room.round.votes.forEach((vote) => {
    tally.set(vote.targetPlayerId, (tally.get(vote.targetPlayerId) || 0) + 1);
  });

  return room.players.map((player) => ({
    playerId: player.id,
    playerName: player.name,
    votes: tally.get(player.id) || 0,
  }));
}

function assignScores(room: Room): void {
  const spyIds = new Set(room.round.spyPlayerIds);

  room.players.forEach((player) => {
    if (room.round.winnerSide === 'civilians' && !spyIds.has(player.id)) {
      player.score += 1;
    }

    if (room.round.winnerSide === 'spy' && spyIds.has(player.id)) {
      player.score += 2;
    }
  });
}

function resolveVotes(room: Room) {
  const tally = new Map<string, number>();

  room.round.votes.forEach((vote) => {
    tally.set(vote.targetPlayerId, (tally.get(vote.targetPlayerId) || 0) + 1);
  });

  let highestVotes = -1;
  let topCandidates: string[] = [];

  tally.forEach((count, playerId) => {
    if (count > highestVotes) {
      highestVotes = count;
      topCandidates = [playerId];
      return;
    }

    if (count === highestVotes) {
      topCandidates.push(playerId);
    }
  });

  const spyCaught =
    topCandidates.length === 1 && room.round.spyPlayerIds.includes(topCandidates[0]);

  room.round.phase = GAME_PHASES.RESULT;
  room.round.revealedSpyIds = [...room.round.spyPlayerIds];
  room.round.winnerSide = spyCaught ? 'civilians' : 'spy';
  assignScores(room);

  return {
    spyPlayerIds: [...room.round.spyPlayerIds],
    winnerSide: room.round.winnerSide,
    voteBreakdown: buildVoteBreakdown(room),
  };
}

function findRoomBySocket(socketId: string): Room | null {
  return (
    listRooms().find((room) =>
      room.players.some((player) => player.socketId === socketId)
    ) || null
  );
}

export function toPublicRoomState(room: Room): PublicRoomState {
  const currentTurnPlayerId =
    room.round.currentTurnIndex >= 0
      ? room.round.speakingOrder[room.round.currentTurnIndex] || null
      : null;

  return {
    code: room.code,
    hostPlayerId: room.hostPlayerId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    canStartGame: getActivePlayers(room).length >= MIN_PLAYERS_TO_START,
    settings: room.settings,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      connected: player.connected,
      score: player.score,
    })),
    round: {
      roundNumber: room.round.roundNumber,
      phase: room.round.phase,
      spyCount: room.round.spyCount,
      speakingOrder: room.round.speakingOrder,
      currentTurnIndex: room.round.currentTurnIndex,
      currentTurnPlayerId,
      votesReceived: room.round.votes.length,
      totalEligibleVoters: getEligibleVoters(room).length,
      revealedSpyIds:
        room.round.phase === GAME_PHASES.RESULT ? room.round.revealedSpyIds : [],
      winnerSide:
        room.round.phase === GAME_PHASES.RESULT ? room.round.winnerSide : null,
    },
  };
}

export function createRoom(input: { playerName: string; socketId: string }) {
  const trimmedName = input.playerName?.trim();

  if (!trimmedName) {
    throw new Error('Player name is required.');
  }

  let roomCode = generateRoomCode(ROOM_CODE_LENGTH);
  while (getRoom(roomCode)) {
    roomCode = generateRoomCode(ROOM_CODE_LENGTH);
  }

  const host = createPlayer({
    name: trimmedName,
    socketId: input.socketId,
    roomCode,
    isHost: true,
  });

  const room: Room = {
    code: roomCode,
    hostPlayerId: host.id,
    players: [host],
    settings: getDefaultRoomSettings(),
    round: createLobbyRound(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  bindSocketToPlayer(input.socketId, host.id);
  saveRoom(room);

  return { room, player: host };
}

export function joinRoom(input: {
  playerName: string;
  roomCode: string;
  socketId: string;
}) {
  const trimmedName = input.playerName?.trim();
  const normalizedRoomCode = input.roomCode?.trim().toUpperCase();

  if (!trimmedName) {
    throw new Error('Player name is required.');
  }

  if (!normalizedRoomCode) {
    throw new Error('Room code is required.');
  }

  const room = ensureRoomExists(normalizedRoomCode);

  if (room.round.phase !== GAME_PHASES.LOBBY) {
    throw new Error('Cannot join a room after the game has started.');
  }

  const duplicateName = room.players.some(
    (player) => player.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicateName) {
    throw new Error('That player name is already in use in this room.');
  }

  const player = createPlayer({
    name: trimmedName,
    socketId: input.socketId,
    roomCode: normalizedRoomCode,
    isHost: false,
  });

  room.players.push(player);
  bindSocketToPlayer(input.socketId, player.id);
  saveRoom(room);

  return { room, player };
}

export function startGame(input: { roomCode: string; playerId: string | null }) {
  const room = ensureRoomExists(input.roomCode);
  ensureHost(room, input.playerId);

  const activePlayers = getActivePlayers(room);

  if (activePlayers.length < MIN_PLAYERS_TO_START) {
    throw new Error(`At least ${MIN_PLAYERS_TO_START} players are required to start.`);
  }

  const selectedSettings = normalizeRoundSettings(room);
  const wordPair = pickRandom(WORD_PAIRS);
  const speakingOrder = shuffle(activePlayers.map((player) => player.id));
  const maxSpyCount = getMaxSpyCount(activePlayers.length);
  const spyCount = selectedSettings.spyCount ?? 1;
  const spyPlayerIds = shuffle(activePlayers.map((player) => player.id)).slice(0, spyCount);
  const civilianWord = selectedSettings.civilianWord || wordPair.civilian;
  const spyWord = selectedSettings.spyWord || wordPair.spy;

  room.round = {
    roundNumber: room.round.roundNumber + 1,
    phase: GAME_PHASES.SPEAKING,
    spyPlayerIds,
    civilianWord,
    spyWord,
    spyCount,
    speakingOrder,
    currentTurnIndex: 0,
    votes: [],
    revealedSpyIds: [],
    winnerSide: null,
  };

  saveRoom(room);
  return room;
}

export function getPrivateRoundInfo(room: Room, playerId: string): PrivateRoundInfo | null {
  if (room.round.phase === GAME_PHASES.LOBBY) {
    return null;
  }

  const role: Role = room.round.spyPlayerIds.includes(playerId) ? 'spy' : 'civilian';

  return {
    playerId,
    role,
    word: role === 'spy' ? room.round.spyWord : room.round.civilianWord,
  };
}

export function advanceTurn(input: { roomCode: string; playerId: string | null }) {
  const room = ensureRoomExists(input.roomCode);
  ensureHost(room, input.playerId);

  if (room.round.phase !== GAME_PHASES.SPEAKING) {
    throw new Error('Speaking phase is not active.');
  }

  if (room.round.currentTurnIndex >= room.round.speakingOrder.length - 1) {
    room.round.phase = GAME_PHASES.VOTING;
    saveRoom(room);
    return { room, movedToVoting: true };
  }

  room.round.currentTurnIndex += 1;
  saveRoom(room);
  return { room, movedToVoting: false };
}

export function submitVote(input: {
  roomCode: string;
  playerId: string | null;
  targetPlayerId: string;
}) {
  const room = ensureRoomExists(input.roomCode);
  const currentPlayer = ensurePlayer(room, input.playerId);

  if (!currentPlayer.connected) {
    throw new Error('Disconnected players cannot vote.');
  }

  if (room.round.phase !== GAME_PHASES.VOTING) {
    throw new Error('Voting phase is not active.');
  }

  if (currentPlayer.id === input.targetPlayerId) {
    throw new Error('You cannot vote for yourself.');
  }

  const targetPlayer = room.players.find((player) => player.id === input.targetPlayerId);

  if (!targetPlayer || !targetPlayer.connected) {
    throw new Error('Vote target is not available.');
  }

  const hasAlreadyVoted = room.round.votes.some((vote) => vote.voterId === currentPlayer.id);

  if (hasAlreadyVoted) {
    throw new Error('Vote already submitted.');
  }

  room.round.votes.push({
    voterId: currentPlayer.id,
    targetPlayerId: input.targetPlayerId,
  });

  const totalEligibleVoters = getEligibleVoters(room).length;
  const votingComplete = room.round.votes.length >= totalEligibleVoters;
  const result = votingComplete ? resolveVotes(room) : null;

  saveRoom(room);

  return {
    room,
    totalEligibleVoters,
    votingComplete,
    result,
  };
}

export function prepareNextRound(input: { roomCode: string; playerId: string | null }) {
  const room = ensureRoomExists(input.roomCode);
  ensureHost(room, input.playerId);

  room.settings = getDefaultRoomSettings();
  room.round = createLobbyRound(room.round.roundNumber);
  saveRoom(room);
  return room;
}

export function updateRoomSettings(input: {
  roomCode: string;
  playerId: string | null;
  settings: Partial<RoundSettings>;
}) {
  const room = ensureRoomExists(input.roomCode);
  ensureHost(room, input.playerId);

  if (room.round.phase !== GAME_PHASES.LOBBY) {
    throw new Error('Room settings can only be changed in the lobby.');
  }

  room.settings = normalizeRoundSettings(room, input.settings);
  saveRoom(room);
  return room;
}

export function removePlayerBySocket(socketId: string): Room | null {
  const room = findRoomBySocket(socketId);

  if (!room) {
    unbindSocket(socketId);
    return null;
  }

  const player = room.players.find((entry) => entry.socketId === socketId);

  if (!player) {
    unbindSocket(socketId);
    return null;
  }

  if (room.round.phase === GAME_PHASES.LOBBY) {
    room.players = room.players.filter((entry) => entry.socketId !== socketId);
  } else {
    player.connected = false;
  }

  if (room.players.length === 0) {
    deleteRoom(room.code);
    unbindSocket(socketId);
    return null;
  }

  if (room.hostPlayerId === player.id) {
    const nextHost = room.players.find((entry) => entry.connected) || room.players[0];

    room.players.forEach((entry) => {
      entry.isHost = entry.id === nextHost.id;
    });
    room.hostPlayerId = nextHost.id;
  }

  if (room.round.phase !== GAME_PHASES.LOBBY && getActivePlayers(room).length < MIN_PLAYERS_TO_START) {
    room.round = createLobbyRound(room.round.roundNumber);
  }

  saveRoom(room);
  unbindSocket(socketId);
  return room;
}

export function leaveRoom(input: { roomCode: string; playerId: string | null }) {
  const room = ensureRoomExists(input.roomCode);
  const player = ensurePlayer(room, input.playerId);
  return removePlayerBySocket(player.socketId);
}
