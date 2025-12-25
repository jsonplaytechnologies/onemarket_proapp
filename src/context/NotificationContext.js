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
  const { isAuthenticated, user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [toastData, setToastData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const soundRef = useRef(null);
  const toastTimeoutRef = useRef(null);

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
      // Clean up toast timeout on unmount
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
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
    // Clear any existing timeout to prevent stale updates
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastData(data);
    playSound();

    // Auto-hide after 4 seconds
    toastTimeoutRef.current = setTimeout(() => {
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

  // Initial fetch on auth (only if account is approved)
  useEffect(() => {
    if (isAuthenticated && user?.approval_status === 'approved') {
      fetchUnreadCount();
      fetchUnreadChatsCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadChatsCount(0);
    }
  }, [isAuthenticated, user?.approval_status, fetchUnreadCount, fetchUnreadChatsCount]);

  // Socket event handlers - defined with useCallback for stable references
  // NOTE: This context handles TOAST NOTIFICATIONS only. State updates are
  // handled by BookingContext. This separation prevents duplicate handlers.

  const handleNotification = useCallback((notification) => {
    console.log('[NotificationContext] Received notification:', notification);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    showToast({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      bookingId: notification.booking_id || notification.bookingId,
    });

    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleBookingRequest = useCallback((data) => {
    console.log('[NotificationContext] New booking request:', data);
    showToast({
      type: 'new_booking',
      title: 'New Booking Request',
      message: `New request for ${data.serviceName}`,
      bookingId: data.bookingId,
    });
    setUnreadCount(prev => prev + 1);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleBookingStatusChanged = useCallback((data) => {
    console.log('[NotificationContext] Booking status changed:', data);

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
  }, [showToast, triggerRefresh]);

  const handleMessageNotification = useCallback((data) => {
    console.log('[NotificationContext] New message:', data);
    showToast({
      type: 'new_message',
      title: 'New Message',
      message: data.preview || 'You have a new message',
      bookingId: data.bookingId,
    });
    setUnreadChatsCount(prev => prev + 1);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handlePaymentConfirmed = useCallback((data) => {
    console.log('[NotificationContext] Payment confirmed:', data);
    showToast({
      type: 'payment',
      title: 'Payment Received',
      message: 'Customer has paid for the booking',
      bookingId: data.bookingId,
    });
    setUnreadCount(prev => prev + 1);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleJobStartApproved = useCallback((data) => {
    console.log('[NotificationContext] Job start approved:', data);
    showToast({
      type: 'job_update',
      title: 'Job Started',
      message: 'Customer confirmed job start',
      bookingId: data.bookingId,
    });
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleJobCompleteApproved = useCallback((data) => {
    console.log('[NotificationContext] Job complete approved:', data);
    showToast({
      type: 'job_complete',
      title: 'Job Completed',
      message: 'Job completed! Earnings credited.',
      bookingId: data.bookingId,
    });
    setUnreadCount(prev => prev + 1);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleNewReview = useCallback((data) => {
    console.log('[NotificationContext] New review:', data);
    showToast({
      type: 'review',
      title: 'New Review',
      message: `You received a ${data.rating}-star review`,
      bookingId: data.bookingId,
    });
    setUnreadCount(prev => prev + 1);
    triggerRefresh();
  }, [showToast, triggerRefresh]);

  const handleWithdrawalStatus = useCallback((data) => {
    console.log('[NotificationContext] Withdrawal status:', data);
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
  }, [showToast]);

  const handleApprovalStatusChanged = useCallback((data) => {
    console.log('[NotificationContext] Approval status changed:', data);
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
  }, [showToast, triggerRefresh]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Register handlers with specific callback references
    on('notification', handleNotification);
    on('booking-request', handleBookingRequest);
    on('booking-status-changed', handleBookingStatusChanged);
    on('message-notification', handleMessageNotification);
    on('payment-confirmed', handlePaymentConfirmed);
    on('job-start-approved', handleJobStartApproved);
    on('job-complete-approved', handleJobCompleteApproved);
    on('new-review', handleNewReview);
    on('withdrawal-status', handleWithdrawalStatus);
    on('approval-status-changed', handleApprovalStatusChanged);

    // Cleanup with specific callback references for proper removal
    return () => {
      off('notification', handleNotification);
      off('booking-request', handleBookingRequest);
      off('booking-status-changed', handleBookingStatusChanged);
      off('message-notification', handleMessageNotification);
      off('payment-confirmed', handlePaymentConfirmed);
      off('job-start-approved', handleJobStartApproved);
      off('job-complete-approved', handleJobCompleteApproved);
      off('new-review', handleNewReview);
      off('withdrawal-status', handleWithdrawalStatus);
      off('approval-status-changed', handleApprovalStatusChanged);
    };
  }, [
    isConnected,
    on,
    off,
    handleNotification,
    handleBookingRequest,
    handleBookingStatusChanged,
    handleMessageNotification,
    handlePaymentConfirmed,
    handleJobStartApproved,
    handleJobCompleteApproved,
    handleNewReview,
    handleWithdrawalStatus,
    handleApprovalStatusChanged,
  ]);

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
