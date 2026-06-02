import { io, Socket } from 'socket.io-client';

// Replace with your backend URL (ensure same origin or CORS configured)
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

// Create a single socket instance to be reused across the app
const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  // If your backend uses JWT auth, you can send token here
  // auth: { token: localStorage.getItem('access_token') },
});

export default socket;
