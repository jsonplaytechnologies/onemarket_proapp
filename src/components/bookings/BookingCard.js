import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { COLORS } from '../../constants/colors';

const BookingCard = ({ booking, onPress }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return 'Pending';
    return `${amount.toLocaleString()} XAF`;
  };

  const serviceName = booking.service_name || booking.serviceName || booking.service?.name || 'Service';
  const userName = booking.user_first_name
    ? `${booking.user_first_name} ${booking.user_last_name || ''}`
    : (booking.user?.firstName ? `${booking.user.firstName} ${booking.user.lastName || ''}` : 'Customer');
  const userAvatar = booking.user_avatar || booking.userAvatar || booking.user?.avatar;
  const zoneName = booking.zone_name || booking.address?.zoneName || booking.zone?.name || '';
  const quotationAmount = booking.quotation_amount || booking.quotationAmount;
  const createdAt = booking.created_at || booking.createdAt;

  return (
    <TouchableOpacity
      className="bg-gray-50 rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        {userAvatar ? (
          <Image
            source={{ uri: userAvatar }}
            style={{ width: 48, height: 48, borderRadius: 16 }}
          />
        ) : (
          <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
            <Ionicons name="person" size={22} color={COLORS.primary} />
          </View>
        )}

        {/* Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <StatusBadge status={booking.status} size="small" />
          </View>
          <Text
            className="text-gray-500 mt-0.5"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
          >
            {serviceName}
          </Text>
        </View>
      </View>

      {/* Details Row */}
      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-200">
        {zoneName && (
          <View className="flex-row items-center flex-1">
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text
              className="text-gray-500 ml-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
              numberOfLines={1}
            >
              {zoneName}
            </Text>
          </View>
        )}

        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text
            className="text-gray-500 ml-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
          >
            {formatDate(createdAt)}
          </Text>
        </View>
      </View>

      {/* Price */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <Text
          className="text-gray-400"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
        >
          {quotationAmount ? 'Quoted' : 'Amount'}
        </Text>
        <Text
          className="text-gray-900"
          style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
        >
          {formatPrice(quotationAmount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default BookingCard;
