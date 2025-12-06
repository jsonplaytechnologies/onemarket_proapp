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

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { markAllAsRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      // Mark all as read (updates both API and context unreadCount)
      markAllAsRead();
    }, [markAllAsRead])
  );

  const fetchNotifications = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.NOTIFICATIONS);
      if (response.success) {
        // API returns { notifications: [...], pagination: {...} }
        setNotifications(response.data?.notifications || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification) => {
    // Handle both snake_case (API) and camelCase field names
    const bookingId = notification.booking_id || notification.bookingId;
    if (bookingId) {
      navigation.navigate('BookingDetails', { bookingId });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
        return { name: 'calendar', color: COLORS.primary };
      case 'booking_cancelled':
        return { name: 'close-circle', color: COLORS.error };
      case 'payment_received':
        return { name: 'card', color: COLORS.success };
      case 'job_start_confirmed':
      case 'job_complete_confirmed':
        return { name: 'checkmark-circle', color: COLORS.success };
      case 'new_review':
        return { name: 'star', color: COLORS.warning };
      case 'withdrawal_approved':
      case 'withdrawal_completed':
        return { name: 'wallet', color: COLORS.success };
      case 'withdrawal_failed':
        return { name: 'wallet', color: COLORS.error };
      case 'account_approved':
        return { name: 'checkmark-done-circle', color: COLORS.success };
      case 'account_rejected':
        return { name: 'close-circle', color: COLORS.error };
      default:
        return { name: 'notifications', color: COLORS.primary };
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    // Handle both snake_case (API) and camelCase field names
    const isRead = item.is_read || item.isRead;
    const createdAt = item.created_at || item.createdAt;

    return (
      <TouchableOpacity
        className={`flex-row px-4 py-4 bg-white border-b border-gray-100 ${
          !isRead ? 'bg-blue-50' : ''
        }`}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${icon.color}20` }}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-medium text-gray-900"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {item.title}
          </Text>
          <Text
            className="text-sm text-gray-600 mt-0.5"
            style={{ fontFamily: 'Poppins-Regular' }}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text
            className="text-xs text-gray-400 mt-1"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {formatTime(createdAt)}
          </Text>
        </View>

        {!isRead && (
          <View className="w-2 h-2 bg-primary rounded-full self-center" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
      <Text
        className="text-xl font-semibold text-gray-900 mt-4 text-center"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        No Notifications
      </Text>
      <Text
        className="text-base text-gray-500 text-center mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        You'll be notified about new bookings and updates here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
          <Text
            className="text-2xl font-bold text-gray-900"
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
      <View className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
        <Text
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Notifications
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          flexGrow: notifications.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NotificationsScreen;
