/**
 * Socket Context
 * Global socket connection management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      console.log('Initializing socket connection...');

      socketRef.current = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message);
      });
    }

    return () => {
      // Cleanup on unmount
    };
  }, [isAuthenticated, token]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      console.log('Disconnecting socket on logout...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      listenersRef.current = {};
    }
  }, [isAuthenticated]);

  // Subscribe to an event
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      // Remove existing listener for this event if any
      if (listenersRef.current[event]) {
        socketRef.current.off(event, listenersRef.current[event]);
      }
      listenersRef.current[event] = callback;
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from an event
  const off = useCallback((event) => {
    if (socketRef.current && listenersRef.current[event]) {
      socketRef.current.off(event, listenersRef.current[event]);
      delete listenersRef.current[event];
    }
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Join a booking room
  const joinBooking = useCallback((bookingId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-booking', bookingId);
    }
  }, [isConnected]);

  // Leave a booking room
  const leaveBooking = useCallback((bookingId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-booking', bookingId);
    }
  }, []);

  // Send chat message
  const sendMessage = useCallback((bookingId, content, messageType = 'text') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-message', { bookingId, content, messageType });
    }
  }, [isConnected]);

  // Send typing indicator
  const setTyping = useCallback((bookingId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { bookingId, isTyping });
    }
  }, [isConnected]);

  // Mark message as read
  const markMessageRead = useCallback((bookingId, messageId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark-read', { bookingId, messageId });
    }
  }, [isConnected]);

  const value = {
    socket: socketRef.current,
    isConnected,
    connectionError,
    on,
    off,
    emit,
    joinBooking,
    leaveBooking,
    sendMessage,
    setTyping,
    markMessageRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
