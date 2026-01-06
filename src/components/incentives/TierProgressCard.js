import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTierInfo, formatBonusRate } from '../../services/incentiveService';
import TierBadge from './TierBadge';

const TierProgressCard = ({
  currentTier = 'starter',
  nextTier,
  progress = {},
  bonusRate = 0,
  onPress,
}) => {
  const currentTierInfo = getTierInfo(currentTier);
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null;

  const jobsProgress = progress.jobs || { current: 0, required: 0 };
  const ratingProgress = progress.rating || { current: 0, required: 0 };

  const jobsPercent = jobsProgress.required > 0
    ? Math.min((jobsProgress.current / jobsProgress.required) * 100, 100)
    : 100;
  const ratingPercent = ratingProgress.required > 0
    ? Math.min((ratingProgress.current / ratingProgress.required) * 100, 100)
    : 100;

  return (
    <TouchableOpacity
      className="bg-gray-50 rounded-2xl p-5"
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: currentTierInfo.bgColor }}
          >
            <Ionicons
              name={currentTierInfo.icon}
              size={24}
              color={currentTierInfo.color}
            />
          </View>
          <View>
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Current Tier
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 18,
                color: currentTierInfo.color,
              }}
            >
              {currentTierInfo.name}
            </Text>
          </View>
        </View>
        {bonusRate > 0 && (
          <View className="bg-green-100 px-3 py-1.5 rounded-full">
            <Text
              className="text-green-700"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}
            >
              +{formatBonusRate(bonusRate)} Bonus
            </Text>
          </View>
        )}
      </View>

      {nextTierInfo && (
        <>
          <View className="border-t border-gray-200 pt-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
              >
                Progress to {nextTierInfo.name}
              </Text>
              <TierBadge tier={nextTier} size="small" showBonus />
            </View>
          </View>

          {/* Jobs Progress */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-gray-600"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
              >
                Jobs Completed
              </Text>
              <Text
                className="text-gray-800"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
              >
                {jobsProgress.current} / {jobsProgress.required}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${jobsPercent}%`,
                  backgroundColor: currentTierInfo.color,
                }}
              />
            </View>
          </View>

          {/* Rating Progress */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-gray-600"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
              >
                Average Rating
              </Text>
              <Text
                className="text-gray-800"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
              >
                {ratingProgress.current.toFixed(1)} / {ratingProgress.required.toFixed(1)}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${ratingPercent}%`,
                  backgroundColor: currentTierInfo.color,
                }}
              />
            </View>
          </View>
        </>
      )}

      {!nextTierInfo && (
        <View className="border-t border-gray-200 pt-4">
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={20} color="#8B5CF6" />
            <Text
              className="text-purple-600 ml-2"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
            >
              You've reached the highest tier!
            </Text>
          </View>
        </View>
      )}

      {onPress && (
        <View className="flex-row items-center justify-end mt-3">
          <Text
            className="text-primary mr-1"
            style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
          >
            View Details
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#2563EB" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TierProgressCard;
