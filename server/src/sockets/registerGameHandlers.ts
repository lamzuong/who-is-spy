import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../config/constants.js';
import {
  advanceTurn,
  createRoom,
  getPrivateRoundInfo,
  joinRoom,
  leaveRoom,
  prepareNextRound,
  removePlayerBySocket,
  sendChatMessage,
  startGame,
  submitVote,
  toPublicRoomState,
  updateRoomSettings,
} from '../game/roomService.js';
import { getPlayerIdBySocket } from '../store/roomStore.js';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  RoomActionPayload,
  SendChatMessagePayload,
  UpdateRoomSettingsPayload,
  VotePayload,
} from '../types/socket.js';
import type { Room } from '../types/game.js';

function emitRoomState(io: Server, room: Room | null): void {
  if (!room) {
    return;
  }

  io.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE, {
    room: toPublicRoomState(room),
  });
}

function emitPrivateWords(io: Server, room: Room): void {
  room.players
    .filter((player) => player.connected)
    .forEach((player) => {
      io.to(player.socketId).emit(
        SOCKET_EVENTS.PRIVATE_WORD,
        getPrivateRoundInfo(room, player.id)
      );
    });
}

function emitError(socket: Socket, error: unknown): void {
  socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
    message: error instanceof Error ? error.message : 'Unexpected server error.',
  });
}

export function registerGameHandlers(io: Server): void {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ playerName, avatar }: CreateRoomPayload) => {
      try {
        const { room, player } = createRoom({ playerName, avatar, socketId: socket.id });
        socket.join(room.code);
        socket.emit(SOCKET_EVENTS.ROOM_STATE, {
          room: toPublicRoomState(room),
          playerId: player.id,
        });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ playerName, roomCode, avatar }: JoinRoomPayload) => {
      try {
        const { room, player } = joinRoom({
          playerName,
          roomCode,
          avatar,
          socketId: socket.id,
        });
        socket.join(room.code);
        emitRoomState(io, room);
        socket.emit(SOCKET_EVENTS.ROOM_STATE, {
          room: toPublicRoomState(room),
          playerId: player.id,
        });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.START_GAME, ({ roomCode }: RoomActionPayload) => {
      try {
        const playerId = getPlayerIdBySocket(socket.id);
        const room = startGame({ roomCode, playerId });

        emitPrivateWords(io, room);
        io.to(room.code).emit(SOCKET_EVENTS.GAME_STARTED, {
          phase: room.round.phase,
          roundNumber: room.round.roundNumber,
          speakingOrder: room.round.speakingOrder,
          currentTurnPlayerId: room.round.speakingOrder[room.round.currentTurnIndex] || null,
        });
        emitRoomState(io, room);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(
      SOCKET_EVENTS.UPDATE_ROOM_SETTINGS,
      ({ roomCode, settings }: UpdateRoomSettingsPayload) => {
        try {
          const playerId = getPlayerIdBySocket(socket.id);
          const room = updateRoomSettings({ roomCode, playerId, settings });
          emitRoomState(io, room);
        } catch (error) {
          emitError(socket, error);
        }
      }
    );

    socket.on(SOCKET_EVENTS.NEXT_TURN, ({ roomCode }: RoomActionPayload) => {
      try {
        const playerId = getPlayerIdBySocket(socket.id);
        const { room, movedToVoting } = advanceTurn({ roomCode, playerId });

        if (movedToVoting) {
          io.to(room.code).emit(SOCKET_EVENTS.VOTING_STARTED, {});
        } else {
          io.to(room.code).emit(SOCKET_EVENTS.TURN_CHANGED, {
            currentTurnPlayerId: room.round.speakingOrder[room.round.currentTurnIndex] || null,
            currentTurnIndex: room.round.currentTurnIndex,
          });
        }

        emitRoomState(io, room);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.SUBMIT_VOTE, ({ roomCode, targetPlayerId }: VotePayload) => {
      try {
        const playerId = getPlayerIdBySocket(socket.id);
        const { room, totalEligibleVoters, votingComplete, result } = submitVote({
          roomCode,
          playerId,
          targetPlayerId,
        });

        io.to(room.code).emit(SOCKET_EVENTS.VOTE_UPDATE, {
          votesReceived: room.round.votes.length,
          totalEligibleVoters,
        });

        if (votingComplete && result) {
          io.to(room.code).emit(SOCKET_EVENTS.ROUND_RESULT, result);
        }

        emitRoomState(io, room);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(
      SOCKET_EVENTS.SEND_CHAT_MESSAGE,
      ({ roomCode, message }: SendChatMessagePayload) => {
        try {
          const playerId = getPlayerIdBySocket(socket.id);
          const room = sendChatMessage({ roomCode, playerId, message });
          emitRoomState(io, room);
        } catch (error) {
          emitError(socket, error);
        }
      }
    );

    socket.on(SOCKET_EVENTS.NEXT_ROUND, ({ roomCode }: RoomActionPayload) => {
      try {
        const playerId = getPlayerIdBySocket(socket.id);
        const room = prepareNextRound({ roomCode, playerId });
        emitRoomState(io, room);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ roomCode }: RoomActionPayload) => {
      try {
        const playerId = getPlayerIdBySocket(socket.id);
        const room = leaveRoom({ roomCode, playerId });
        socket.leave(roomCode);
        emitRoomState(io, room);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on('disconnect', () => {
      const room = removePlayerBySocket(socket.id);
      emitRoomState(io, room);
    });
  });
}
