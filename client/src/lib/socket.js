import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(socketUrl, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

/**
 * Open socket connection and attach JWT credentials
 */
export const connectSocket = () => {
  const token = localStorage.getItem('accessToken');
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Terminate socket connection
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
