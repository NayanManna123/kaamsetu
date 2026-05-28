import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/**
 * Socket Provider
 * Uses the socket.io CDN loaded in index.html (window.io)
 * 
 * Features:
 * - Tracks online users count
 * - Exposes typing indicator helper
 * - Auto-reconnection with backoff
 */
export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // For demo mode, create a mock socket
    const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token';
    if (isDemo) {
      const mockSocket = {
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
        connected: false,
      };
      setSocket(mockSocket);
      setConnected(false);
      return;
    }

    // Use window.io from the CDN script loaded in index.html
    if (!window.io) {
      console.warn('Socket.io not loaded from CDN');
      return;
    }

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const socketInstance = window.io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('⚡ Socket connected to server');
      // Join personal room for notifications
      socketInstance.emit('join', user._id);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Socket disconnected from server');
    });

    socketInstance.on('onlineCount', (data) => {
      setOnlineCount(data.count || 0);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Typing indicator helper
  const emitTyping = useCallback(
    (roomId, isTyping) => {
      if (socket && user) {
        socket.emit('typing', {
          roomId,
          userId: user._id,
          name: user.name,
          isTyping,
        });
      }
    },
    [socket, user]
  );

  return (
    <SocketContext.Provider value={{ socket, connected, onlineCount, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
