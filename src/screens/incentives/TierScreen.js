import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useIncentive } from '../../context/IncentiveContext';
import { COLORS } from '../../constants/colors';
import { getTierInfo, formatBonusRate, PROVIDER_TIERS } from '../../services/incentiveService';
import { TierBadge } from '../../components/incentives';

const TierScreen = ({ navigation }) => {
  const {
    tierStatus,
    tierBenefits,
    loading,
    refreshing,
    fetchTierStatus,
    fetchTierBenefits,
  } = useIncentive();

  const [initialLoading, setInitialLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setInitialLoading(true);
        await Promise.all([
          fetchTierStatus(),
          fetchTierBenefits(),
        ]);
        setInitialLoading(false);
      };
      loadData();
    }, [fetchTierStatus, fetchTierBenefits])
  );

  const onRefresh = async () => {
    await Promise.all([
      fetchTierStatus(true),
      fetchTierBenefits(true),
    ]);
  };

  const currentTier = tierStatus?.tier || tierStatus?.currentTier || 'starter';
  const nextTier = tierStatus?.nextTier;
  const currentTierInfo = getTierInfo(currentTier);
  const bonusRate = tierStatus?.bonusRate || currentTierInfo.bonusRate || 0;
  const progress = tierStatus?.progressToNext || tierStatus?.progress || {};

  const jobsCompleted = tierStatus?.jobsCompleted || progress.jobs?.current || 0;
  const averageRating = tierStatus?.averageRating || progress.rating?.current || 0;

  // Merge API tier benefits with hardcoded UI info (name, icon, colors)
  const getMergedTierInfo = (tierKey) => {
    const uiInfo = getTierInfo(tierKey);
    const apiData = tierBenefits?.tiers?.find(t => t.tier === tierKey);

    if (apiData?.thresholds) {
      return {
        ...uiInfo,
        bonusRate: apiData.bonusRate ?? uiInfo.bonusRate,
        minJobs: apiData.thresholds.minJobs ?? uiInfo.minJobs,
        minRating: apiData.thresholds.minRating ?? uiInfo.minRating,
      };
    }

    return uiInfo; // Fallback to hardcoded if API data not available
  };

  // Create tiers array using API data if available, otherwise fall back to hardcoded
  const tiers = tierBenefits?.tiers
    ? tierBenefits.tiers.map(t => [t.tier, getMergedTierInfo(t.tier)])
    : Object.entries(PROVIDER_TIERS);

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-4"
            >
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 24 }}
            >
              Your Tier
            </Text>
          </View>

          {/* Current Tier Card */}
          <View
            className="rounded-2xl p-6 items-center"
            style={{ backgroundColor: currentTierInfo.bgColor }}
          >
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            >
              <Ionicons
                name={currentTierInfo.icon}
                size={40}
                color={currentTierInfo.color}
              />
            </View>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 28,
                color: currentTierInfo.color,
              }}
            >
              {currentTierInfo.name}
            </Text>
            {bonusRate > 0 && (
              <View className="bg-white/50 px-4 py-2 rounded-full mt-2">
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: 16,
                    color: currentTierInfo.color,
                  }}
                >
                  +{formatBonusRate(bonusRate)} Bonus on Earnings
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Your Stats */}
        <View className="px-6 mb-6">
          <Text
            className="text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
          >
            Your Stats
          </Text>

          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="flex-row">
              <View className="flex-1 items-center py-2 border-r border-gray-200">
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
                >
                  {jobsCompleted}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Jobs Completed
                </Text>
              </View>
              <View className="flex-1 items-center py-2">
                <View className="flex-row items-center">
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
                  >
                    {(averageRating || 0).toFixed(1)}
                  </Text>
                  <Ionicons name="star" size={20} color="#FBBF24" className="ml-1" />
                </View>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Average Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress to Next Tier */}
        {nextTier && (
          <View className="px-6 mb-6">
            <Text
              className="text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
            >
              Progress to {getMergedTierInfo(nextTier).name}
            </Text>

            <View className="bg-gray-50 rounded-2xl p-4">
              {/* Jobs Progress */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                    <Text
                      className="text-gray-600 ml-2"
                      style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
                    >
                      Jobs Completed
                    </Text>
                  </View>
                  <Text
                    className="text-gray-800"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}
                  >
                    {progress.jobs?.current || jobsCompleted || 0} / {progress.jobs?.required || getMergedTierInfo(nextTier)?.minJobs || 0}
                  </Text>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((((progress.jobs?.current || jobsCompleted || 0) / (progress.jobs?.required || getMergedTierInfo(nextTier)?.minJobs || 1)) * 100) || 0, 100)}%`,
                      backgroundColor: currentTierInfo.color,
                    }}
                  />
                </View>
              </View>

              {/* Rating Progress */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="star-outline" size={16} color="#6B7280" />
                    <Text
                      className="text-gray-600 ml-2"
                      style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
                    >
                      Average Rating
                    </Text>
                  </View>
                  <Text
                    className="text-gray-800"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}
                  >
                    {(progress.rating?.current || averageRating || 0).toFixed(1)} / {(progress.rating?.required || getMergedTierInfo(nextTier)?.minRating || 0).toFixed(1)}
                  </Text>
                </View>
                <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((((progress.rating?.current || averageRating || 0) / (progress.rating?.required || getMergedTierInfo(nextTier)?.minRating || 1)) * 100) || 0, 100)}%`,
                      backgroundColor: currentTierInfo.color,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* All Tiers */}
        <View className="px-6 mb-8">
          <Text
            className="text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
          >
            All Tiers
          </Text>

          {tiers.map(([tierKey, tierInfo], index) => {
            const isCurrentTier = tierKey === currentTier;

            return (
              <View
                key={tierKey}
                className={`rounded-2xl p-4 mb-3 ${
                  isCurrentTier ? 'border-2' : 'bg-gray-50'
                }`}
                style={isCurrentTier ? { borderColor: tierInfo.color, backgroundColor: tierInfo.bgColor } : {}}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: tierInfo.bgColor }}
                  >
                    <Ionicons
                      name={tierInfo.icon}
                      size={24}
                      color={tierInfo.color}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          fontSize: 16,
                          color: tierInfo.color,
                        }}
                      >
                        {tierInfo.name}
                      </Text>
                      {isCurrentTier && (
                        <View className="bg-white/50 px-2 py-0.5 rounded-full ml-2">
                          <Text
                            style={{
                              fontFamily: 'Poppins-Medium',
                              fontSize: 10,
                              color: tierInfo.color,
                            }}
                          >
                            CURRENT
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                    >
                      {tierInfo.minJobs}+ jobs, {(tierInfo.minRating || 0).toFixed(1)}+ rating
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      style={{
                        fontFamily: 'Poppins-Bold',
                        fontSize: 16,
                        color: tierInfo.bonusRate > 0 ? '#16A34A' : '#9CA3AF',
                      }}
                    >
                      {tierInfo.bonusRate > 0 ? `+${formatBonusRate(tierInfo.bonusRate)}` : 'No Bonus'}
                    </Text>
                    <Text
                      className="text-gray-400"
                      style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
                    >
                      {tierInfo.bonusRate > 0 ? 'bonus' : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TierScreen;
