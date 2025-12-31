/**
 * Notification Context
 * Global notification state, unread count, and toast management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Vibration } from 'react-native';
import { useSocketContext } from './SocketContext';
import { useAuth } from './AuthContext';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import cacheManager, { CACHE_KEYS, CACHE_TYPES } from '../utils/cacheManager';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

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

  // Play notification sound and vibrate (memoized for useCallback dependencies)
  const playSound = useCallback(async () => {
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
  }, []);

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
  }, [playSound]);

  // Hide toast
  const hideToast = useCallback(() => {
    setToastData(null);
  }, []);

  // Debounced refresh trigger to prevent spam
  const debouncedRefreshRef = useRef(null);

  // Initialize debounced function
  useEffect(() => {
    debouncedRefreshRef.current = debounce(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000); // 1 second debounce
  }, []);

  // Trigger refresh for screens (debounced to prevent spam)
  const triggerRefresh = useCallback(() => {
    if (debouncedRefreshRef.current) {
      debouncedRefreshRef.current();
    }
  }, []);

  // Immediate refresh (bypasses debounce for critical updates)
  const triggerImmediateRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch notifications from API with caching
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && !cacheManager.isStale(CACHE_KEYS.NOTIFICATIONS, CACHE_TYPES.NOTIFICATIONS)) {
        const cached = cacheManager.get(CACHE_KEYS.NOTIFICATIONS, CACHE_TYPES.NOTIFICATIONS);
        if (cached) {
          setNotifications(cached);
          return;
        }
      }

      const response = await cacheManager.deduplicatedFetch(
        CACHE_KEYS.NOTIFICATIONS,
        () => apiService.get(API_ENDPOINTS.NOTIFICATIONS)
      );

      if (response.success) {
        const notifs = response.data?.notifications || response.data || [];
        setNotifications(notifs);
        cacheManager.set(CACHE_KEYS.NOTIFICATIONS, notifs);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Combined fetch for all unread counts (reduces 2 API calls to 1)
  // Falls back to separate calls if combined endpoint not available
  const fetchAllUnreadCounts = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedNotifCount = cacheManager.get(CACHE_KEYS.UNREAD_COUNT, CACHE_TYPES.NOTIFICATIONS);
        const cachedChatsCount = cacheManager.get(CACHE_KEYS.UNREAD_CHATS_COUNT, CACHE_TYPES.NOTIFICATIONS);

        if (cachedNotifCount !== null && cachedChatsCount !== null) {
          setUnreadCount(cachedNotifCount);
          setUnreadChatsCount(cachedChatsCount);
          return;
        }
      }

      // Try combined endpoint first (if backend supports it)
      try {
        const statusResponse = await apiService.get(API_ENDPOINTS.NOTIFICATIONS_STATUS);
        if (statusResponse.success) {
          const unread = statusResponse.data?.unreadCount ?? 0;
          const chatsUnread = statusResponse.data?.unreadChatsCount ?? 0;
          setUnreadCount(unread);
          setUnreadChatsCount(chatsUnread);
          cacheManager.set(CACHE_KEYS.UNREAD_COUNT, unread);
          cacheManager.set(CACHE_KEYS.UNREAD_CHATS_COUNT, chatsUnread);
          return;
        }
      } catch {
        // Combined endpoint not available, fall back to separate calls
      }

      // Fallback: fetch both in parallel
      const [unreadRes, chatsRes] = await Promise.all([
        cacheManager.deduplicatedFetch(
          CACHE_KEYS.UNREAD_COUNT,
          () => apiService.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT)
        ),
        cacheManager.deduplicatedFetch(
          CACHE_KEYS.UNREAD_CHATS_COUNT,
          () => apiService.get(API_ENDPOINTS.CONVERSATIONS)
        ),
      ]);

      if (unreadRes.success) {
        const count = unreadRes.data?.unreadCount ?? 0;
        setUnreadCount(count);
        cacheManager.set(CACHE_KEYS.UNREAD_COUNT, count);
      }

      if (chatsRes.success) {
        const count = chatsRes.data?.totalUnread ?? 0;
        setUnreadChatsCount(count);
        cacheManager.set(CACHE_KEYS.UNREAD_CHATS_COUNT, count);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, []);

  // Legacy methods for backward compatibility
  const fetchUnreadCount = useCallback(async () => {
    await fetchAllUnreadCounts();
  }, [fetchAllUnreadCounts]);

  const fetchUnreadChatsCount = useCallback(async () => {
    await fetchAllUnreadCounts();
  }, [fetchAllUnreadCounts]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiService.patch(API_ENDPOINTS.NOTIFICATION_READ(notificationId));
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.patch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  // Initial fetch on auth (only if account is approved)
  useEffect(() => {
    if (isAuthenticated && user?.approval_status === 'approved') {
      // Single call to fetch all unread counts
      fetchAllUnreadCounts();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadChatsCount(0);
      // Clear cache on logout
      cacheManager.invalidate(CACHE_KEYS.NOTIFICATIONS);
      cacheManager.invalidate(CACHE_KEYS.UNREAD_COUNT);
      cacheManager.invalidate(CACHE_KEYS.UNREAD_CHATS_COUNT);
    }
  }, [isAuthenticated, user?.approval_status, fetchAllUnreadCounts]);

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
    fetchAllUnreadCounts,
    markAsRead,
    markAllAsRead,
    showToast,
    hideToast,
    triggerRefresh,
    triggerImmediateRefresh,
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
