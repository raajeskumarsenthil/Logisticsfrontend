import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket'],
    });
    console.log('Socket.io connected to:', WS_URL);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket.io disconnected');
  }
};
