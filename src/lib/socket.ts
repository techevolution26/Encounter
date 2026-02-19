import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token?: string) {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('socket connected', socket!.id);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnect');
  });

  return socket;
}

export default function getSocket() {
  return socket;
}
