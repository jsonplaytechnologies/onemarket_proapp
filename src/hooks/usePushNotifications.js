/**
 * Push Notifications Hook
 * Handles push notification setup, permissions, and token management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, removePushToken } from '../services/pushTokenService';

// Storage key for push token
const PUSH_TOKEN_KEY = 'expoPushToken';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Show system notification
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook for managing push notifications
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} Push notification state and methods
 */
export function usePushNotifications(isAuthenticated = false) {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const isRegistering = useRef(false);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    // Prevent multiple simultaneous registration attempts
    if (isRegistering.current) return null;
    isRegistering.current = true;

    try {
      // Push notifications only work on physical devices
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        isRegistering.current = false;
        return null;
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      setPermissionStatus(existingStatus);

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(status);
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        isRegistering.current = false;
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      console.log('Expo push token:', token);

      // Store token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      setExpoPushToken(token);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
          sound: 'default',
        });
      }

      isRegistering.current = false;
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      isRegistering.current = false;
      return null;
    }
  }, []);

  // Register token with backend
  const registerTokenWithBackend = useCallback(async (token) => {
    if (!token) return;

    try {
      await registerPushToken(
        token,
        Platform.OS,
        Device.modelName || 'Unknown Device'
      );
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  }, []);

  // Unregister token from backend (call on logout)
  const unregisterToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token) {
        await removePushToken(token);
        console.log('Push token removed from backend');
      }
    } catch (error) {
      console.error('Failed to remove push token:', error);
    }
  }, []);

  // Clear local token storage
  const clearLocalToken = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      setExpoPushToken(null);
    } catch (error) {
      console.error('Failed to clear local push token:', error);
    }
  }, []);

  // Get stored token
  const getStoredToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token) {
        setExpoPushToken(token);
      }
      return token;
    } catch (error) {
      console.error('Failed to get stored push token:', error);
      return null;
    }
  }, []);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const initializePushNotifications = async () => {
      // First check for existing token
      let token = await getStoredToken();

      // If no token, register for push notifications
      if (!token) {
        token = await registerForPushNotifications();
      }

      // Register with backend if we have a token
      if (token && isMounted) {
        await registerTokenWithBackend(token);
      }
    };

    initializePushNotifications();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, getStoredToken, registerForPushNotifications, registerTokenWithBackend]);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    registerForPushNotifications,
    unregisterToken,
    clearLocalToken,
  };
}

/**
 * Handle notification tap/response
 * This is called when user taps on a notification
 */
function handleNotificationResponse(response) {
  const data = response.notification.request.content.data;

  // Log for debugging
  console.log('Notification tapped with data:', data);

  // Navigation will be handled by the app based on notification type
  // The notification data includes: type, bookingId, reservationId, appointmentId, etc.
}

/**
 * Get the last notification response (for handling app opened from notification)
 */
export async function getLastNotificationResponse() {
  const response = await Notifications.getLastNotificationResponseAsync();
  return response;
}

/**
 * Schedule a local notification (for testing or reminders)
 */
export async function scheduleLocalNotification(title, body, data = {}, seconds = 1) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'notification.mp3',
    },
    trigger: { seconds },
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

export default usePushNotifications;
