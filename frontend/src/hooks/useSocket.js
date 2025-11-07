import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for Socket.IO connection
 * Handles connection, reconnection, and event management
 */
export function useSocket(token, userId) {
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!token || !userId) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);

      // Emit user-joined event
      socket.emit('user-joined', { userId, username: sessionStorage.getItem('username') });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  // Function to emit events
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Function to listen to events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);

      // Store listener for cleanup
      if (!listenersRef.current[event]) {
        listenersRef.current[event] = [];
      }
      listenersRef.current[event].push(callback);
    }
  }, []);

  // Function to remove listener
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);

      if (listenersRef.current[event]) {
        listenersRef.current[event] = listenersRef.current[event].filter(
          (listener) => listener !== callback
        );
      }
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected || false,
  };
}
