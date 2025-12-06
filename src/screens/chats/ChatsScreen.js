import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { useNotifications } from '../../context/NotificationContext';

const ChatsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshTrigger, fetchUnreadChatsCount } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      // Refresh the badge count when screen is focused
      fetchUnreadChatsCount();
    }, [fetchUnreadChatsCount])
  );

  // Auto-refresh when new messages arrive
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      fetchConversations();
    }
  }, [refreshTrigger]);

  const fetchConversations = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CONVERSATIONS);
      if (response.success) {
        setConversations(response.data?.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
      case 'quotation_sent':
        return '#F59E0B';
      case 'paid':
      case 'on_the_way':
        return '#3B82F6';
      case 'job_started':
      case 'job_start_requested':
      case 'job_complete_requested':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      accepted: 'Accepted',
      quotation_sent: 'Quoted',
      paid: 'Paid',
      on_the_way: 'En Route',
      job_started: 'In Progress',
      job_start_requested: 'Start Pending',
      job_complete_requested: 'Complete Pending',
    };
    return labels[status] || status;
  };

  const handleChatPress = (conversation) => {
    navigation.navigate('Chat', {
      bookingId: conversation.booking_id,
      booking: {
        user: {
          firstName: conversation.user_first_name,
          lastName: conversation.user_last_name,
          avatar: conversation.user_avatar,
        },
      },
    });
  };

  const renderConversation = ({ item }) => {
    const userName = `${item.user_first_name || ''} ${item.user_last_name || ''}`.trim() || 'Customer';
    const unreadCount = parseInt(item.unread_count) || 0;
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        className={`flex-row items-center px-4 py-4 border-b border-gray-100 ${hasUnread ? 'bg-blue-50' : 'bg-white'}`}
        activeOpacity={0.7}
        onPress={() => handleChatPress(item)}
      >
        {/* Avatar */}
        {item.user_avatar ? (
          <Image
            source={{ uri: item.user_avatar }}
            style={{ width: 52, height: 52, borderRadius: 26 }}
          />
        ) : (
          <View className="w-13 h-13 bg-blue-100 rounded-full items-center justify-center" style={{ width: 52, height: 52 }}>
            <Ionicons name="person" size={24} color={COLORS.primary} />
          </View>
        )}

        {/* Content */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-base ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}
              style={{ fontFamily: hasUnread ? 'Poppins-Bold' : 'Poppins-Medium' }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className={`text-xs ${hasUnread ? 'text-primary font-semibold' : 'text-gray-400'}`}
              style={{ fontFamily: hasUnread ? 'Poppins-SemiBold' : 'Poppins-Regular' }}
            >
              {formatTime(item.last_message_at || item.created_at)}
            </Text>
          </View>

          <View className="flex-row items-center mt-0.5">
            <View
              className="px-2 py-0.5 rounded-full mr-2"
              style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
            >
              <Text
                className="text-xs"
                style={{ fontFamily: 'Poppins-Medium', color: getStatusColor(item.status) }}
              >
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <Text
              className="text-xs text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
              numberOfLines={1}
            >
              {item.service_name}
            </Text>
          </View>

          <Text
            className={`text-sm mt-1 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            style={{ fontFamily: hasUnread ? 'Poppins-Medium' : 'Poppins-Regular' }}
            numberOfLines={1}
          >
            {item.last_message || 'No messages yet'}
          </Text>
        </View>

        {/* Unread Badge */}
        {hasUnread && (
          <View className="bg-primary rounded-full min-w-6 h-6 items-center justify-center px-2 ml-2">
            <Text
              className="text-white text-xs font-bold"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
      </View>
      <Text
        className="text-xl font-semibold text-gray-900 text-center"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        No Active Chats
      </Text>
      <Text
        className="text-base text-gray-500 text-center mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        Chats with customers will appear here once you accept bookings
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-4 pb-4 border-b border-gray-100">
          <Text
            className="text-2xl text-gray-900"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Chats
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-gray-100">
        <Text
          className="text-2xl text-gray-900"
          style={{ fontFamily: 'Poppins-Bold' }}
        >
          Chats
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.booking_id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          flexGrow: conversations.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default ChatsScreen;
