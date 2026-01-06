import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReferralPartnerCard = ({
  referral,
  onPress,
}) => {
  const {
    referredUser,
    status,
    jobsCompleted = 0,
    jobsRequired = 5,
    averageRating = 0,
    ratingRequired = 4.0,
    referrerRewardAmount = 0,
    createdAt,
  } = referral || {};

  const firstName = referredUser?.profile?.firstName || referredUser?.firstName || '';
  const lastName = referredUser?.profile?.lastName || referredUser?.lastName || '';
  const avatarUrl = referredUser?.profile?.avatarUrl || referredUser?.avatarUrl;
  const fullName = `${firstName} ${lastName}`.trim() || 'Provider';

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'rewarded':
        return {
          label: 'Rewarded',
          color: '#16A34A',
          bgColor: '#DCFCE7',
          icon: 'checkmark-circle',
        };
      case 'qualified':
        return {
          label: 'Qualified',
          color: '#2563EB',
          bgColor: '#DBEAFE',
          icon: 'ribbon',
        };
      case 'expired':
        return {
          label: 'Expired',
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: 'time-outline',
        };
      case 'pending':
      default:
        return {
          label: 'In Progress',
          color: '#D97706',
          bgColor: '#FEF3C7',
          icon: 'hourglass-outline',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const jobsPercent = Math.min((jobsCompleted / jobsRequired) * 100, 100);

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View className="flex-row items-center mb-3">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 16 }}
          />
        ) : (
          <View className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
            <Ionicons name="person" size={24} color="#9CA3AF" />
          </View>
        )}
        <View className="flex-1 ml-3">
          <Text
            className="text-gray-900"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
          >
            {fullName}
          </Text>
          <Text
            className="text-gray-400"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
          >
            Joined {formatDate(createdAt)}
          </Text>
        </View>
        <View
          className="px-3 py-1.5 rounded-full flex-row items-center"
          style={{ backgroundColor: statusConfig.bgColor }}
        >
          <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text
            className="ml-1"
            style={{
              fontFamily: 'Poppins-Medium',
              fontSize: 12,
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {status === 'pending' && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Progress: {jobsCompleted}/{jobsRequired} jobs
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              {averageRating.toFixed(1)} rating
            </Text>
          </View>
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${jobsPercent}%` }}
            />
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        <Text
          className="text-gray-500"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
        >
          Reward
        </Text>
        <Text
          style={{
            fontFamily: 'Poppins-SemiBold',
            fontSize: 14,
            color: status === 'rewarded' ? '#16A34A' : '#6B7280',
          }}
        >
          {status === 'rewarded' ? '+' : ''}{formatCurrency(referrerRewardAmount)}
          {status === 'rewarded' && ' earned'}
          {status === 'pending' && ' pending'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ReferralPartnerCard;
