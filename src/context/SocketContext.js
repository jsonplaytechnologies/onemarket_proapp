/**
 * Socket Context
 * Global socket connection management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/api';

const SocketContext = createContext(null);

// Terminal booking statuses that should not be rejoined on reconnection
const TERMINAL_STATUSES = ['rejected', 'cancelled', 'failed', 'expired', 'quote_expired', 'quote_rejected'];

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  // Changed from object to Map with arrays to support multiple callbacks per event
  const listenersRef = useRef(new Map());
  // Track active booking rooms for reconnection
  const activeBookingsRef = useRef(new Set());
  // Track previous token to detect changes
  const previousTokenRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token) {
      // Check if token changed - need to reconnect with new token
      if (socketRef.current && previousTokenRef.current !== token) {
        console.log('Token changed, reconnecting socket with new token...');
        // IMPORTANT: Disconnect FIRST to prevent events arriving during cleanup
        const oldSocket = socketRef.current;
        socketRef.current = null;
        oldSocket.disconnect();
        // Then clear listener tracking (socket is already disconnected)
        listenersRef.current.clear();
      }

      previousTokenRef.current = token;

      if (!socketRef.current) {
        console.log('Initializing socket connection...');

        socketRef.current = io(API_BASE_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 15,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        socketRef.current.on('connect', () => {
          console.log('Socket connected:', socketRef.current.id);
          setIsConnected(true);
          setConnectionError(null);

          // Rejoin all active booking rooms after reconnection with acknowledgment
          activeBookingsRef.current.forEach(bookingId => {
            console.log('Rejoining booking room after reconnection:', bookingId);
            socketRef.current.emit('join-booking', bookingId, (response) => {
              if (response?.success) {
                console.log(`Successfully rejoined booking room: ${bookingId}`);
              } else {
                // Remove from tracking if join failed
                activeBookingsRef.current.delete(bookingId);
                // Only log as error if it's not an expected terminal state
                if (response?.code === 'BOOKING_INACTIVE') {
                  console.log(`Booking ${bookingId} is now in terminal state - removed from active rooms`);
                } else {
                  console.error(`Failed to rejoin booking room: ${bookingId}`, response?.code);
                }
              }
            });
          });
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
          // Don't log BOOKING_INACTIVE as error - it's expected for terminal bookings
          if (error?.code === 'BOOKING_INACTIVE') {
            console.log('Socket info: Booking is in terminal state, socket room not available');
            return;
          }
          console.error('Socket error:', error);
          setConnectionError(error.message || error.code);
        });

        // Global listener to clean up terminal status bookings from activeBookingsRef
        // This prevents reconnect logic from trying to rejoin rooms for rejected/cancelled bookings
        socketRef.current.on('booking-status-changed', (data) => {
          if (data.bookingId && TERMINAL_STATUSES.includes(data.status)) {
            console.log(`Removing terminal booking ${data.bookingId} (${data.status}) from active rooms`);
            activeBookingsRef.current.delete(data.bookingId);
          }
        });
      }
    }

    return () => {
      // Cleanup on unmount - remove all listeners and disconnect
      if (socketRef.current) {
        // Remove all registered listeners
        listenersRef.current.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            socketRef.current.off(event, callback);
          });
        });
        listenersRef.current.clear();
        activeBookingsRef.current.clear();
        console.log('Disconnecting socket on cleanup...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, token]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      console.log('Disconnecting socket on logout...');
      // Remove all registered listeners
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socketRef.current.off(event, callback);
        });
      });
      listenersRef.current.clear();
      activeBookingsRef.current.clear();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  // Subscribe to an event - supports multiple callbacks per event
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      // Get existing callbacks for this event or create empty array
      const callbacks = listenersRef.current.get(event) || [];
      // Add new callback if not already registered
      if (!callbacks.includes(callback)) {
        callbacks.push(callback);
        listenersRef.current.set(event, callbacks);
        socketRef.current.on(event, callback);
      }
    }
  }, []);

  // Unsubscribe from an event - removes specific callback or all if none provided
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        if (callback) {
          // Remove specific callback
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
            socketRef.current.off(event, callback);
          }
          // Clean up if no more callbacks
          if (callbacks.length === 0) {
            listenersRef.current.delete(event);
          }
        } else {
          // Remove all callbacks for this event
          callbacks.forEach(cb => socketRef.current.off(event, cb));
          listenersRef.current.delete(event);
        }
      }
    }
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Join a booking room - tracks for reconnection
  const joinBooking = useCallback((bookingId, onStatusUpdate) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-booking', bookingId, (response) => {
        if (response?.success) {
          activeBookingsRef.current.add(bookingId);
          console.log('Joined booking room:', bookingId, 'status:', response.status);
          // If callback provided, notify of current status
          if (onStatusUpdate && response.status) {
            onStatusUpdate({ bookingId, status: response.status });
          }
        } else {
          // If booking is in terminal state, this is expected - don't log as error
          if (response?.code === 'BOOKING_INACTIVE') {
            activeBookingsRef.current.delete(bookingId);
            console.log(`Booking ${bookingId} is in terminal state: ${response.status || 'unknown'} - socket room not needed`);
            // Notify callback so UI can update to show correct status
            if (onStatusUpdate && response.status) {
              onStatusUpdate({ bookingId, status: response.status });
            }
          } else {
            // Only log actual errors (not expected terminal states)
            console.error('Failed to join booking room:', bookingId, response?.code);
          }
        }
      });
    }
  }, [isConnected]);

  // Leave a booking room - removes from tracking
  const leaveBooking = useCallback((bookingId) => {
    activeBookingsRef.current.delete(bookingId);
    if (socketRef.current) {
      socketRef.current.emit('leave-booking', bookingId);
    }
  }, []);

  // Send chat message with acknowledgment support
  const sendMessage = useCallback((bookingId, content, messageType = 'text') => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Guard against multiple resolve/reject if both callback and timeout fire
      let resolved = false;

      // Set timeout for acknowledgment
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Message send timeout'));
        }
      }, 10000); // 10 second timeout

      socketRef.current.emit(
        'send-message',
        { bookingId, content, messageType },
        (response) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (response && response.success) {
              resolve(response.message);
            } else {
              reject(new Error(response?.code || 'Failed to send message'));
            }
          }
        }
      );
    });
  }, [isConnected]);

  // Send chat message without waiting for acknowledgment (fire and forget)
  const sendMessageAsync = useCallback((bookingId, content, messageType = 'text') => {
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

  // Mark message as read with acknowledgment support
  const markMessageRead = useCallback((bookingId, messageId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Guard against multiple resolve/reject if both callback and timeout fire
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Mark read timeout'));
        }
      }, 5000);

      socketRef.current.emit(
        'mark-read',
        { bookingId, messageId },
        (response) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (response && response.success) {
              resolve(response);
            } else {
              reject(new Error(response?.code || 'Failed to mark as read'));
            }
          }
        }
      );
    });
  }, [isConnected]);

  // Mark message as read without waiting (fire and forget)
  const markMessageReadAsync = useCallback((bookingId, messageId) => {
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
    sendMessageAsync,
    setTyping,
    markMessageRead,
    markMessageReadAsync,
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
