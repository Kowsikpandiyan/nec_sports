import { useEffect } from 'react';
import { socket, connectSocket } from '../lib/socket';

/**
 * React hook to listen to socket updates in matches
 * @param {string} matchId Match room ID to subscribe to
 * @returns {Object} Socket instance
 */
const useSocket = (matchId = null) => {
  useEffect(() => {
    // Open connection
    connectSocket();

    if (matchId) {
      socket.emit('match:subscribe', matchId);
    }

    return () => {
      if (matchId) {
        socket.emit('match:unsubscribe', matchId);
      }
    };
  }, [matchId]);

  return socket;
};

export default useSocket;
