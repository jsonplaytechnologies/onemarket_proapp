/**
 * Notification Context
 * Global notification state, unread count, and toast management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import { useSocketContext } from './SocketContext';
import { useAuth } from './AuthContext';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

// Try to import expo-av, fallback if not available
let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('expo-av not available, notifications will use vibration only');
}

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isConnected, on, off } = useSocketContext();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [toastData, setToastData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const soundRef = useRef(null);

  // Load notification sound (if expo-av available)
  useEffect(() => {
    const loadSound = async () => {
      if (!Audio) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/notification.mp3')
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Could not load notification sound:', error);
      }
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Play notification sound and vibrate
  const playSound = async () => {
    // Vibrate phone
    Vibration.vibrate(200);

    // Play sound if available
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  };

  // Show toast notification
  const showToast = useCallback((data) => {
    setToastData(data);
    playSound();

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToastData(null);
    }, 4000);
  }, []);

  // Hide toast
  const hideToast = useCallback(() => {
    setToastData(null);
  }, []);

  // Trigger refresh for screens
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS);
      if (response.success) {
        const notifs = response.data?.notifications || response.data || [];
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      if (response.success) {
        // API returns { unreadCount: number }
        setUnreadCount(response.data?.unreadCount ?? 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch unread chats count
  const fetchUnreadChatsCount = useCallback(async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CONVERSATIONS);
      if (response.success) {
        // API returns { conversations: [...], totalUnread: number }
        setUnreadChatsCount(response.data?.totalUnread ?? 0);
      }
    } catch (error) {
      console.error('Error fetching unread chats count:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.patch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  // Initial fetch on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchUnreadChatsCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadChatsCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchUnreadChatsCount]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // General notification
    on('notification', (notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      showToast({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        bookingId: notification.booking_id || notification.bookingId,
      });

      triggerRefresh();
    });

    // New booking request (for pro)
    on('booking-request', (data) => {
      console.log('New booking request:', data);
      showToast({
        type: 'new_booking',
        title: 'New Booking Request',
        message: `New request for ${data.serviceName}`,
        bookingId: data.bookingId,
      });
      setUnreadCount(prev => prev + 1);
      triggerRefresh();
    });

    // Booking status changed
    on('booking-status-changed', (data) => {
      console.log('Booking status changed:', data);

      const statusMessages = {
        paid: 'Customer has paid for the booking',
        cancelled: 'Booking was cancelled',
        job_started: 'Job has started',
        completed: 'Job completed successfully',
      };

      if (statusMessages[data.status]) {
        showToast({
          type: 'booking_update',
          title: 'Booking Update',
          message: statusMessages[data.status],
          bookingId: data.bookingId,
          status: data.status,
        });
      }

      triggerRefresh();
    });

    // New message notification
    on('message-notification', (data) => {
      console.log('New message:', data);
      showToast({
        type: 'new_message',
        title: 'New Message',
        message: data.preview || 'You have a new message',
        bookingId: data.bookingId,
      });
      setUnreadChatsCount(prev => prev + 1);
      triggerRefresh();
    });

    // Payment confirmed
    on('payment-confirmed', (data) => {
      console.log('Payment confirmed:', data);
      showToast({
        type: 'payment',
        title: 'Payment Received',
        message: 'Customer has paid for the booking',
        bookingId: data.bookingId,
      });
      setUnreadCount(prev => prev + 1);
      triggerRefresh();
    });

    // Job start approved
    on('job-start-approved', (data) => {
      console.log('Job start approved:', data);
      showToast({
        type: 'job_update',
        title: 'Job Started',
        message: 'Customer confirmed job start',
        bookingId: data.bookingId,
      });
      triggerRefresh();
    });

    // Job complete approved
    on('job-complete-approved', (data) => {
      console.log('Job complete approved:', data);
      showToast({
        type: 'job_complete',
        title: 'Job Completed',
        message: 'Job completed! Earnings credited.',
        bookingId: data.bookingId,
      });
      setUnreadCount(prev => prev + 1);
      triggerRefresh();
    });

    // New review
    on('new-review', (data) => {
      console.log('New review:', data);
      showToast({
        type: 'review',
        title: 'New Review',
        message: `You received a ${data.rating}-star review`,
        bookingId: data.bookingId,
      });
      setUnreadCount(prev => prev + 1);
      triggerRefresh();
    });

    // Withdrawal status
    on('withdrawal-status', (data) => {
      console.log('Withdrawal status:', data);
      const messages = {
        approved: 'Withdrawal approved',
        completed: 'Withdrawal completed',
        rejected: 'Withdrawal rejected',
      };

      if (messages[data.status]) {
        showToast({
          type: 'withdrawal',
          title: 'Withdrawal Update',
          message: messages[data.status],
        });
        setUnreadCount(prev => prev + 1);
      }
    });

    // Account approval status
    on('approval-status-changed', (data) => {
      console.log('Approval status changed:', data);
      const messages = {
        approved: 'Your account has been approved!',
        rejected: 'Your account was not approved',
      };

      if (messages[data.status]) {
        showToast({
          type: 'account',
          title: 'Account Status',
          message: messages[data.status],
        });
        setUnreadCount(prev => prev + 1);
        triggerRefresh();
      }
    });

    return () => {
      off('notification');
      off('booking-request');
      off('booking-status-changed');
      off('message-notification');
      off('payment-confirmed');
      off('job-start-approved');
      off('job-complete-approved');
      off('new-review');
      off('withdrawal-status');
      off('approval-status-changed');
    };
  }, [isConnected, on, off, showToast, triggerRefresh]);

  const value = {
    notifications,
    unreadCount,
    unreadChatsCount,
    toastData,
    refreshTrigger,
    fetchNotifications,
    fetchUnreadCount,
    fetchUnreadChatsCount,
    markAllAsRead,
    showToast,
    hideToast,
    triggerRefresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
