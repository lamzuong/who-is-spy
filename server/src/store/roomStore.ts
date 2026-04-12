import type { Room } from '../types/game.js';

const rooms = new Map<string, Room>();
const socketToPlayer = new Map<string, string>();

export function listRooms(): Room[] {
  return Array.from(rooms.values());
}

export function getRoom(roomCode: string): Room | null {
  return rooms.get(roomCode) || null;
}

export function saveRoom(room: Room): Room {
  room.updatedAt = Date.now();
  rooms.set(room.code, room);
  return room;
}

export function deleteRoom(roomCode: string): void {
  const room = rooms.get(roomCode);

  if (room) {
    room.players.forEach((player) => {
      socketToPlayer.delete(player.socketId);
    });
  }

  rooms.delete(roomCode);
}

export function bindSocketToPlayer(socketId: string, playerId: string): void {
  socketToPlayer.set(socketId, playerId);
}

export function getPlayerIdBySocket(socketId: string): string | null {
  return socketToPlayer.get(socketId) || null;
}

export function unbindSocket(socketId: string): void {
  socketToPlayer.delete(socketId);
}
