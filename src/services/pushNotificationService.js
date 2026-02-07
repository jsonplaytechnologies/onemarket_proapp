/**
 * Push Notification Service for Pro App
 * Handles FCM token registration, permissions, and notification handlers
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 * Returns the native device push token (FCM on Android, APNs on iOS)
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
  }

  // Get the native device push token (FCM for Android, APNs for iOS)
  const tokenData = await Notifications.getDevicePushTokenAsync();
  return tokenData.data;
}

/**
 * Set up notification response handler (when user taps a notification)
 * @param {Object} navigationRef - React Navigation ref for deep linking
 * @returns {Function} cleanup function to remove listeners
 */
export function setupNotificationHandlers(navigationRef) {
  // Handle notification taps (app in background or killed)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      if (!navigationRef?.current) return;

      // Navigate based on notification type
      if (data.bookingId) {
        navigationRef.current.navigate('BookingDetails', { bookingId: data.bookingId });
      }
    }
  );

  return () => {
    responseSubscription.remove();
  };
}
