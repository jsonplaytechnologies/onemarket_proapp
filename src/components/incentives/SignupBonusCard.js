import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SignupBonusCard = ({
  status = 'pending',
  progress = {},
  rewardAmount = 0,
  deadline,
  onPress,
}) => {
  const isRewarded = status === 'rewarded';
  const isExpired = status === 'expired';
  const isPending = status === 'pending';

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
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  const jobsCompleted = progress.jobsCompleted || 0;
  const jobsRequired = progress.jobsRequired || 5;
  const averageRating = progress.averageRating || 0;
  const ratingRequired = progress.ratingRequired || 4.0;

  const jobsPercent = Math.min((jobsCompleted / jobsRequired) * 100, 100);
  const ratingPercent = ratingRequired > 0
    ? Math.min((averageRating / ratingRequired) * 100, 100)
    : 100;

  if (isRewarded) {
    return (
      <View className="bg-green-50 rounded-2xl p-5">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
          </View>
          <View className="flex-1">
            <Text
              className="text-green-800"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
            >
              Signup Bonus Earned!
            </Text>
            <Text
              className="text-green-600"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              {formatCurrency(rewardAmount)} added to your wallet
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (isExpired) {
    return (
      <View className="bg-gray-100 rounded-2xl p-5">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center mr-3">
            <Ionicons name="time-outline" size={28} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text
              className="text-gray-700"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
            >
              Signup Bonus Expired
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              The qualification period has ended
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      className="bg-amber-50 rounded-2xl p-5"
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-amber-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="gift" size={24} color="#D97706" />
          </View>
          <View>
            <Text
              className="text-amber-800"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
            >
              Signup Bonus
            </Text>
            <Text
              className="text-amber-600"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              Earn {formatCurrency(rewardAmount)}
            </Text>
          </View>
        </View>
        {daysRemaining !== null && (
          <View className="bg-amber-200 px-3 py-1.5 rounded-full">
            <Text
              className="text-amber-800"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
            >
              {daysRemaining}d left
            </Text>
          </View>
        )}
      </View>

      {/* Jobs Progress */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Ionicons name="briefcase-outline" size={14} color="#92400E" />
            <Text
              className="text-amber-700 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              Jobs Completed
            </Text>
          </View>
          <Text
            className="text-amber-900"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
          >
            {jobsCompleted} / {jobsRequired}
          </Text>
        </View>
        <View className="h-2 bg-amber-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-amber-500 rounded-full"
            style={{ width: `${jobsPercent}%` }}
          />
        </View>
      </View>

      {/* Rating Progress */}
      <View>
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={14} color="#92400E" />
            <Text
              className="text-amber-700 ml-1"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              Average Rating
            </Text>
          </View>
          <Text
            className="text-amber-900"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
          >
            {averageRating.toFixed(1)} / {ratingRequired.toFixed(1)}
          </Text>
        </View>
        <View className="h-2 bg-amber-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-amber-500 rounded-full"
            style={{ width: `${ratingPercent}%` }}
          />
        </View>
      </View>

      {deadline && (
        <Text
          className="text-amber-600 mt-3 text-center"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
        >
          Complete by {formatDate(deadline)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default SignupBonusCard;
