import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';
import BookNowBadge from './BookNowBadge';
import { COLORS } from '../../constants/colors';

// Star Rating Component
const StarRating = ({ rating, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color="#FBBF24" />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <Ionicons key={i} name="star-half" size={size} color="#FBBF24" />
      );
    } else {
      stars.push(
        <Ionicons key={i} name="star-outline" size={size} color="#D1D5DB" />
      );
    }
  }

  return <View className="flex-row items-center">{stars}</View>;
};

const BookingCard = ({ booking, onPress }) => {
  const { t } = useTranslation();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return t('bookingCard.pending');
    return `${amount.toLocaleString()} XAF`;
  };

  // Format requested datetime with relative dates
  const formatRequestedDateTime = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (dateOnly.getTime() === today.getTime()) {
      return t('bookingCard.todayAt', { time });
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return t('bookingCard.tomorrowAt', { time });
    } else {
      return t('bookingCard.dateAt', { date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }), time });
    }
  };

  const serviceName = booking.service_name || booking.serviceName || booking.service?.name || t('bookingCard.service');
  const userName = booking.user_first_name
    ? `${booking.user_first_name} ${booking.user_last_name || ''}`
    : (booking.user?.firstName ? `${booking.user.firstName} ${booking.user.lastName || ''}` : t('bookingCard.customer'));
  const userAvatar = booking.user_avatar || booking.userAvatar || booking.user?.avatar;
  const zoneName = booking.zone_name || booking.address?.zoneName || booking.zone?.name || '';
  const quotationAmount = booking.quotation_amount || booking.quotationAmount;
  const proEarnings = booking.pro_earnings || booking.proEarnings;
  const createdAt = booking.created_at || booking.createdAt;
  const completedAt = booking.completed_at || booking.completedAt;
  const requestedDatetime = booking.requested_datetime || booking.requestedDatetime;
  const reviewRating = booking.review_rating || booking.reviewRating;
  const cancelledAt = booking.cancelled_at || booking.cancelledAt;
  const cancellationReason = booking.cancellation_reason || booking.cancellationReason;
  const rejectedAt = booking.rejected_at || booking.rejectedAt;
  const rejectionReason = booking.rejection_reason || booking.rejectionReason;
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled' || booking.status === 'canceled';
  const isFailed = booking.status === 'failed';
  const isRejected = booking.status === 'rejected' || booking.status === 'quote_rejected';
  const isExpired = booking.status === 'expired' || booking.status === 'quote_expired';
  const isReassigned = booking.status === 'reassigned';

  // Simplified card for expired/quote_expired bookings
  if (isExpired) {
    const statusLabel = booking.status === 'quote_expired' ? t('bookingCard.quoteExpired') : t('bookingCard.timedOut');
    return (
      <TouchableOpacity
        className="bg-amber-50 rounded-2xl p-4 mb-3 border border-amber-100"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View className="w-11 h-11 bg-amber-100 rounded-full items-center justify-center">
              <Ionicons name="person" size={20} color="#F59E0B" />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {serviceName}
            </Text>
          </View>

          {/* Amount (strikethrough) */}
          <View className="items-end">
            {quotationAmount ? (
              <Text
                className="text-gray-400 line-through"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {formatPrice(quotationAmount)}
              </Text>
            ) : null}
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
            >
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-amber-100">
          <View className="flex-row items-center">
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text
              className="text-amber-600 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Simplified card for reassigned bookings
  if (isReassigned) {
    return (
      <TouchableOpacity
        className="bg-gray-100 rounded-2xl p-4 mb-3 border border-gray-200"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View className="w-11 h-11 bg-gray-200 rounded-full items-center justify-center">
              <Ionicons name="person" size={20} color="#6B7280" />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {serviceName}
            </Text>
          </View>

          {/* Date */}
          <View className="items-end">
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
            >
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <Ionicons name="swap-horizontal" size={16} color="#6B7280" />
            <Text
              className="text-gray-500 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              {t('bookingCard.reassigned')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Simplified card for rejected bookings
  if (isRejected) {
    return (
      <TouchableOpacity
        className="bg-orange-50 rounded-2xl p-4 mb-3 border border-orange-100"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View className="w-11 h-11 bg-orange-100 rounded-full items-center justify-center">
              <Ionicons name="person" size={20} color="#F97316" />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {serviceName}
            </Text>
          </View>

          {/* Amount (strikethrough) */}
          <View className="items-end">
            {quotationAmount ? (
              <Text
                className="text-gray-400 line-through"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {formatPrice(quotationAmount)}
              </Text>
            ) : null}
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
            >
              {formatDate(rejectedAt || createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-orange-100">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={16} color="#F97316" />
            <Text
              className="text-orange-600 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              {t('bookingCard.rejected')}
            </Text>
          </View>

          {rejectionReason ? (
            <Text
              className="text-gray-400 flex-1 text-right ml-2"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              numberOfLines={1}
            >
              {rejectionReason}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // Simplified card for cancelled/failed bookings
  if (isCancelled || isFailed) {
    const statusColor = isFailed ? 'red' : 'gray';
    const bgColor = isFailed ? 'bg-red-50' : 'bg-gray-100';
    const borderColor = isFailed ? 'border-red-100' : 'border-gray-200';
    const iconBgColor = isFailed ? 'bg-red-100' : 'bg-gray-200';
    const iconColor = isFailed ? '#EF4444' : '#6B7280';
    const textColor = isFailed ? 'text-red-600' : 'text-gray-500';
    const statusLabel = isFailed ? t('bookingCard.failed') : t('bookingCard.cancelled');
    const statusIcon = isFailed ? 'alert-circle' : 'close-circle';

    return (
      <TouchableOpacity
        className={`${bgColor} rounded-2xl p-4 mb-3 border ${borderColor}`}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View className={`w-11 h-11 ${iconBgColor} rounded-full items-center justify-center`}>
              <Ionicons name="person" size={20} color={iconColor} />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {serviceName}
            </Text>
          </View>

          {/* Amount (strikethrough) */}
          <View className="items-end">
            {quotationAmount ? (
              <Text
                className="text-gray-400 line-through"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {formatPrice(quotationAmount)}
              </Text>
            ) : null}
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
            >
              {formatDate(cancelledAt || createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <Ionicons name={statusIcon} size={16} color={iconColor} />
            <Text
              className={`${textColor} ml-1`}
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              {statusLabel}
            </Text>
          </View>

          {cancellationReason ? (
            <Text
              className="text-gray-400 flex-1 text-right ml-2"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              numberOfLines={1}
            >
              {cancellationReason}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  // Simplified card for completed bookings
  if (isCompleted) {
    return (
      <TouchableOpacity
        className="bg-green-50 rounded-2xl p-4 mb-3 border border-green-100"
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View className="w-11 h-11 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name="person" size={20} color="#10B981" />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              numberOfLines={1}
            >
              {userName}
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {serviceName}
            </Text>
          </View>

          {/* Earnings */}
          <View className="items-end">
            <Text
              className="text-green-600"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 15 }}
            >
              +{formatPrice(proEarnings || quotationAmount)}
            </Text>
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
            >
              {formatDate(completedAt || createdAt)}
            </Text>
          </View>
        </View>

        {/* Rating Row */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-green-100">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text
              className="text-green-700 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              {t('bookingCard.completed')}
            </Text>
          </View>

          {reviewRating ? (
            <View className="flex-row items-center">
              <StarRating rating={reviewRating} size={14} />
              <Text
                className="text-gray-600 ml-1"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
              >
                {reviewRating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              {t('bookingCard.noRatingYet')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Regular card for non-completed bookings
  return (
    <TouchableOpacity
      className="bg-gray-50 rounded-2xl p-4 mb-3"
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Book Now Badge at top if applicable */}
      {booking.is_book_now && (
        <View className="mb-3">
          <BookNowBadge />
        </View>
      )}

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
          {/* Show booking path badge */}
          {booking.booking_path && (
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-0.5 rounded ${
                  booking.booking_path === 'auto' ? 'bg-purple-100' : 'bg-blue-100'
                }`}
              >
                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 10,
                    color: booking.booking_path === 'auto' ? '#7C3AED' : '#1D4ED8',
                  }}
                >
                  {booking.booking_path === 'auto' ? 'AUTO' : 'MANUAL'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Scheduled Time - Prominent display */}
      {(requestedDatetime || booking.is_book_now) && (
        <View className="mt-3 pt-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <View className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${booking.is_book_now ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Ionicons
                name={booking.is_book_now ? 'flash' : 'calendar'}
                size={16}
                color={booking.is_book_now ? '#EF4444' : COLORS.primary}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                {booking.is_book_now ? t('bookingCard.immediateRequest') : t('bookingCard.scheduledFor')}
              </Text>
              <Text
                className={booking.is_book_now ? 'text-red-600' : 'text-gray-900'}
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              >
                {booking.is_book_now ? t('bookingCard.asap') : formatRequestedDateTime(requestedDatetime)}
              </Text>
            </View>
          </View>
        </View>
      )}

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
          {quotationAmount ? t('bookingCard.quoted') : t('bookingCard.amount')}
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
