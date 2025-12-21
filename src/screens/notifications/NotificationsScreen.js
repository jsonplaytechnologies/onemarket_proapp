import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { useNotifications } from '../../context/NotificationContext';

// Pro-specific notification icons (outline style like user app)
const NOTIFICATION_ICONS = {
  new_booking: 'calendar-outline',
  booking_cancelled: 'close-circle-outline',
  payment_received: 'card-outline',
  job_start_confirmed: 'checkmark-circle-outline',
  job_complete_confirmed: 'checkmark-done-circle-outline',
  new_review: 'star-outline',
  withdrawal_approved: 'wallet-outline',
  withdrawal_completed: 'wallet-outline',
  withdrawal_failed: 'wallet-outline',
  account_approved: 'checkmark-done-circle-outline',
  account_rejected: 'close-circle-outline',
  message: 'chatbubble-outline',
  default: 'notifications-outline',
};

// Pro-specific notification colors
const NOTIFICATION_COLORS = {
  new_booking: '#3B82F6',
  booking_cancelled: '#EF4444',
  payment_received: '#10B981',
  job_start_confirmed: '#10B981',
  job_complete_confirmed: '#10B981',
  new_review: '#F59E0B',
  withdrawal_approved: '#10B981',
  withdrawal_completed: '#10B981',
  withdrawal_failed: '#EF4444',
  account_approved: '#10B981',
  account_rejected: '#EF4444',
  message: '#3B82F6',
  default: '#6B7280',
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { markAllAsRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchNotificationsAndMarkRead();
    }, [])
  );

  const fetchNotificationsAndMarkRead = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS);
      if (response.success && response.data) {
        const notificationsList = response.data.notifications || response.data || [];
        const notifs = Array.isArray(notificationsList) ? notificationsList : [];

        // Show notifications with their actual read state first
        setNotifications(notifs);

        // Mark all as read on server and update badge count after a delay
        const hasUnread = notifs.some(n => !(n.is_read || n.isRead));
        if (hasUnread) {
          // Delay marking as read so user can see unread highlights
          setTimeout(() => {
            markAllAsRead();
            // Also update local state to remove blue tint
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, isRead: true })));
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS);
      if (response.success && response.data) {
        const notificationsList = response.data.notifications || response.data || [];
        setNotifications(Array.isArray(notificationsList) ? notificationsList : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    const bookingId = notification.booking_id || notification.bookingId;
    if (bookingId) {
      navigation.navigate('BookingDetails', { bookingId });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getIcon = (type) => NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
  const getColor = (type) => NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default;

  const renderNotification = ({ item }) => {
    // Handle both snake_case (API) and camelCase field names
    const isRead = item.is_read || item.isRead;
    const createdAt = item.created_at || item.createdAt;

    return (
      <TouchableOpacity
        className={`flex-row items-start px-6 py-4 ${!isRead ? 'bg-blue-50' : 'bg-white'}`}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <View
          className="w-11 h-11 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${getColor(item.type)}15` }}
        >
          <Ionicons
            name={getIcon(item.type)}
            size={20}
            color={getColor(item.type)}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className={`text-sm flex-1 mr-2 ${
                !isRead ? 'text-gray-900' : 'text-gray-600'
              }`}
              style={{ fontFamily: !isRead ? 'Poppins-SemiBold' : 'Poppins-Medium' }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              className="text-xs text-gray-400"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {formatTime(createdAt)}
            </Text>
          </View>

          <Text
            className="text-sm text-gray-400 mt-1"
            style={{ fontFamily: 'Poppins-Regular' }}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>

        {!isRead && (
          <View className="w-2 h-2 rounded-full bg-primary mt-2 ml-2" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Ionicons name="notifications-off-outline" size={36} color="#9CA3AF" />
      </View>
      <Text
        className="text-lg text-gray-900"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        All Caught Up
      </Text>
      <Text
        className="text-sm text-gray-400 text-center mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        New notifications will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-6 pt-14 pb-4">
          <Text
            className="text-2xl text-gray-900"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Notifications
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text
          className="text-2xl text-gray-900"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Notifications
        </Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100 mx-6" />}
      />
    </View>
  );
};

export default NotificationsScreen;
