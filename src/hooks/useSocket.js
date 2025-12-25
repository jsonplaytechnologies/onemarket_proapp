/**
 * Socket Hooks for Pro App
 * Wrappers around SocketContext for backward compatibility
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';

// Main socket hook - wraps SocketContext
export const useSocket = () => {
  const socketContext = useSocketContext();
  return socketContext;
};

// Hook for booking-specific socket events (Pro version)
export const useBookingSocket = (bookingId) => {
  const {
    isConnected,
    joinBooking,
    leaveBooking,
    sendMessage,
    setTyping,
    markMessageRead,
    on,
    off,
  } = useSocketContext();

  const [messages, setMessages] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Use ref to track current bookingId for handlers to avoid stale closures
  const bookingIdRef = useRef(bookingId);
  useEffect(() => {
    bookingIdRef.current = bookingId;
  }, [bookingId]);

  // Define handlers with useCallback to maintain stable references
  // These handlers use bookingIdRef to always have current bookingId
  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => {
      const prevMessages = Array.isArray(prev) ? prev : [];
      // Only check for duplicates if message has an id
      if (message.id) {
        const exists = prevMessages.some(m => m.id === message.id);
        if (exists) return prevMessages;
      }
      return [...prevMessages, message];
    });
  }, []);

  const handleStatusChange = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(data);
    }
  }, []);

  const handleTyping = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setIsUserTyping(data.isTyping);
    }
  }, []);

  const handleMessageRead = useCallback((data) => {
    setMessages((prev) => {
      const prevMessages = Array.isArray(prev) ? prev : [];
      return prevMessages.map((msg) =>
        msg.id === data.messageId ? { ...msg, isRead: true, is_read: true } : msg
      );
    });
  }, []);

  const handlePaymentConfirmed = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, status: 'paid', ...data }));
    }
  }, []);

  const handleJobStartApproved = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, status: 'job_started', ...data }));
    }
  }, []);

  const handleJobCompleteApproved = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, status: 'completed', ...data }));
    }
  }, []);

  const handleAssignmentTimeoutWarning = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, timeoutWarning: true, secondsRemaining: data.secondsRemaining }));
    }
  }, []);

  const handleQuoteTimeoutWarning = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, timeoutWarning: true, secondsRemaining: data.secondsRemaining }));
    }
  }, []);

  const handleQuoteAccepted = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, status: 'paid', paidAmount: data.paidAmount }));
    }
  }, []);

  const handleQuoteDeclined = useCallback((data) => {
    if (data.bookingId === bookingIdRef.current) {
      setBookingStatus(prev => ({ ...prev, status: 'quote_rejected', reason: data.reason }));
    }
  }, []);

  const handleJobConflictWarning = useCallback((data) => {
    if (data.currentBookingId === bookingIdRef.current || data.nextBookingId === bookingIdRef.current) {
      setNotifications(prev => [...prev, { type: 'conflict', data }]);
    }
  }, []);

  useEffect(() => {
    if (isConnected && bookingId) {
      joinBooking(bookingId);

      // Register all event handlers
      on('new-message', handleNewMessage);
      on('booking-status-changed', handleStatusChange);
      // Both 'user-typing' and 'customer-typing' indicate the customer is typing
      // (from the pro's perspective, the "user" is the customer)
      on('user-typing', handleTyping);
      on('customer-typing', handleTyping);
      on('message-read', handleMessageRead);
      on('payment-confirmed', handlePaymentConfirmed);
      on('job-start-approved', handleJobStartApproved);
      on('job-complete-approved', handleJobCompleteApproved);

      // Phase 2 events
      on('assignment-timeout-warning', handleAssignmentTimeoutWarning);
      on('quote-timeout-warning', handleQuoteTimeoutWarning);
      on('quote-accepted', handleQuoteAccepted);
      on('quote-declined', handleQuoteDeclined);
      on('job-conflict-warning', handleJobConflictWarning);

      return () => {
        leaveBooking(bookingId);
        // Cleanup with exact handler references ensures proper removal
        off('new-message', handleNewMessage);
        off('booking-status-changed', handleStatusChange);
        off('user-typing', handleTyping);
        off('customer-typing', handleTyping);
        off('message-read', handleMessageRead);
        off('payment-confirmed', handlePaymentConfirmed);
        off('job-start-approved', handleJobStartApproved);
        off('job-complete-approved', handleJobCompleteApproved);

        // Phase 2 events
        off('assignment-timeout-warning', handleAssignmentTimeoutWarning);
        off('quote-timeout-warning', handleQuoteTimeoutWarning);
        off('quote-accepted', handleQuoteAccepted);
        off('quote-declined', handleQuoteDeclined);
        off('job-conflict-warning', handleJobConflictWarning);
      };
    }
  }, [
    isConnected,
    bookingId,
    joinBooking,
    leaveBooking,
    on,
    off,
    // Include all handlers in deps - they are stable due to useCallback
    handleNewMessage,
    handleStatusChange,
    handleTyping,
    handleMessageRead,
    handlePaymentConfirmed,
    handleJobStartApproved,
    handleJobCompleteApproved,
    handleAssignmentTimeoutWarning,
    handleQuoteTimeoutWarning,
    handleQuoteAccepted,
    handleQuoteDeclined,
    handleJobConflictWarning,
  ]);

  // Send message with Promise support - returns Promise for acknowledgment
  const send = useCallback(
    async (content, type = 'text') => {
      try {
        const message = await sendMessage(bookingId, content, type);
        return message;
      } catch (error) {
        console.error('Failed to send message:', error.message);
        throw error;
      }
    },
    [bookingId, sendMessage]
  );

  // Fire-and-forget send (for backwards compatibility)
  const sendAsync = useCallback(
    (content, type = 'text') => {
      sendMessage(bookingId, content, type).catch(err => {
        console.error('Message send failed:', err.message);
      });
    },
    [bookingId, sendMessage]
  );

  const typing = useCallback(
    (isTyping) => {
      setTyping(bookingId, isTyping);
    },
    [bookingId, setTyping]
  );

  // Mark message as read with Promise support
  const markRead = useCallback(
    async (messageId) => {
      try {
        const result = await markMessageRead(bookingId, messageId);
        return result;
      } catch (error) {
        console.error('Failed to mark message as read:', error.message);
        throw error;
      }
    },
    [bookingId, markMessageRead]
  );

  // Fire-and-forget mark read (for backwards compatibility)
  const markReadAsync = useCallback(
    (messageId) => {
      markMessageRead(bookingId, messageId).catch(err => {
        console.error('Mark read failed:', err.message);
      });
    },
    [bookingId, markMessageRead]
  );

  return {
    isConnected,
    messages,
    setMessages,
    bookingStatus,
    isUserTyping,
    notifications,
    send,
    sendAsync,
    typing,
    markRead,
    markReadAsync,
    on,
    off,
  };
};

export default useSocket;
