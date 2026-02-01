import { io, Socket } from "socket.io-client";
import { API_URL } from "./client";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || socket.disconnected) {
    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
