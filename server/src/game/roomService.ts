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
  Role,
  Room,
  RoundState,
  VoteBreakdownItem,
} from '../types/game.js';
import { generateId, generateRoomCode, pickRandom, shuffle } from '../utils/id.js';

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
    spyPlayerId: null,
    civilianWord: null,
    spyWord: null,
    speakingOrder: [],
    currentTurnIndex: -1,
    votes: [],
    revealedSpyId: null,
    winnerSide: null,
  };
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
  const spyId = room.round.spyPlayerId;

  room.players.forEach((player) => {
    if (room.round.winnerSide === 'civilians' && player.id !== spyId) {
      player.score += 1;
    }

    if (room.round.winnerSide === 'spy' && player.id === spyId) {
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
    topCandidates.length === 1 && topCandidates[0] === room.round.spyPlayerId;

  room.round.phase = GAME_PHASES.RESULT;
  room.round.revealedSpyId = room.round.spyPlayerId;
  room.round.winnerSide = spyCaught ? 'civilians' : 'spy';
  assignScores(room);

  return {
    spyPlayerId: room.round.spyPlayerId,
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
      speakingOrder: room.round.speakingOrder,
      currentTurnIndex: room.round.currentTurnIndex,
      currentTurnPlayerId,
      votesReceived: room.round.votes.length,
      totalEligibleVoters: getEligibleVoters(room).length,
      revealedSpyId:
        room.round.phase === GAME_PHASES.RESULT ? room.round.revealedSpyId : null,
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

  const wordPair = pickRandom(WORD_PAIRS);
  const speakingOrder = shuffle(activePlayers.map((player) => player.id));
  const spyPlayerId = pickRandom(activePlayers).id;

  room.round = {
    roundNumber: room.round.roundNumber + 1,
    phase: GAME_PHASES.SPEAKING,
    spyPlayerId,
    civilianWord: wordPair.civilian,
    spyWord: wordPair.spy,
    speakingOrder,
    currentTurnIndex: 0,
    votes: [],
    revealedSpyId: null,
    winnerSide: null,
  };

  saveRoom(room);
  return room;
}

export function getPrivateRoundInfo(room: Room, playerId: string): PrivateRoundInfo | null {
  if (room.round.phase === GAME_PHASES.LOBBY) {
    return null;
  }

  const role: Role = room.round.spyPlayerId === playerId ? 'spy' : 'civilian';

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

  room.round = createLobbyRound(room.round.roundNumber);
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
