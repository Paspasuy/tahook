import { GameRoom } from "./GameRoom";
import { Question } from "../models/orm/Question";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class GameManager {
  private rooms: Map<string, GameRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  createRoom(
    quizId: string,
    quizTitle: string,
    ownerId: string,
    questions: Question[]
  ): GameRoom {
    let code = generateRoomCode();
    // Ensure unique code
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = new GameRoom(code, quizId, quizTitle, ownerId, questions);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomBySocketId(socketId: string): GameRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  joinRoom(code: string, socketId: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    this.socketToRoom.set(socketId, code.toUpperCase());
    return true;
  }

  leaveRoom(socketId: string): void {
    this.socketToRoom.delete(socketId);
  }

  deleteRoom(code: string): boolean {
    const deleted = this.rooms.delete(code.toUpperCase());
    // Clean up socket mappings for this room
    for (const [socketId, roomCode] of this.socketToRoom.entries()) {
      if (roomCode === code.toUpperCase()) {
        this.socketToRoom.delete(socketId);
      }
    }
    return deleted;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  // Get all active rooms (for debugging/admin)
  getAllRooms(): { code: string; quizTitle: string; playerCount: number }[] {
    return Array.from(this.rooms.values()).map((room) => ({
      code: room.state.code,
      quizTitle: room.state.quizTitle,
      playerCount: room.getPlayerCount(),
    }));
  }
}

export const gameManager = new GameManager();
