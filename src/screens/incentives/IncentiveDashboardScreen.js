import React, { useEffect, useCallback } from 'react';
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
import {
  ReferralCodeCard,
  TierProgressCard,
  SignupBonusCard,
} from '../../components/incentives';

const IncentiveDashboardScreen = ({ navigation }) => {
  const {
    referralCode,
    referralStats,
    tierStatus,
    signupBonus,
    loading,
    refreshing,
    fetchDashboard,
    shareReferralCode,
    refreshAll,
    hasActiveSignupBonus,
  } = useIncentive();

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const stats = referralStats?.stats || referralStats || {};
  const code = referralCode?.code || referralStats?.referralCode?.code;
  const totalUses = referralCode?.totalUses || referralStats?.referralCode?.totalUses || 0;
  const totalEarned = stats.totalRewardsEarned || 0;

  const currentTier = tierStatus?.tier || tierStatus?.currentTier || 'starter';
  const nextTier = tierStatus?.nextTier;
  const bonusRate = tierStatus?.bonusRate || 0;
  const progress = tierStatus?.progressToNext || tierStatus?.progress || {};

  if (loading && !referralCode && !tierStatus) {
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
            onRefresh={refreshAll}
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
              Incentives & Rewards
            </Text>
          </View>

          {/* Tier Progress Card */}
          <TierProgressCard
            currentTier={currentTier}
            nextTier={nextTier}
            progress={progress}
            bonusRate={bonusRate}
            onPress={() => navigation.navigate('Tier')}
          />
        </View>

        {/* Referral Code Card */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
            >
              Referral Program
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Referrals')}
              className="flex-row items-center"
            >
              <Text
                className="text-primary mr-1"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                View All
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ReferralCodeCard
            code={code}
            totalUses={totalUses}
            totalEarned={totalEarned}
            onShare={shareReferralCode}
          />
        </View>

        {/* Signup Bonus Card - only show if active */}
        {hasActiveSignupBonus() && (
          <View className="px-6 mb-6">
            <Text
              className="text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
            >
              Signup Bonus
            </Text>
            <SignupBonusCard
              status={signupBonus?.status}
              progress={{
                jobsCompleted: signupBonus?.progress?.jobsCompleted ?? signupBonus?.progress?.jobs_completed ?? 0,
                jobsRequired: signupBonus?.requirements?.minJobs ?? signupBonus?.requirements?.min_jobs ?? 0,
                averageRating: signupBonus?.progress?.averageRating ?? 0,
                ratingRequired: signupBonus?.requirements?.minRating ?? signupBonus?.requirements?.min_rating ?? 0,
              }}
              rewardAmount={signupBonus?.rewardAmount ?? signupBonus?.rewardPoints ?? 0}
              deadline={signupBonus?.qualificationDeadline ?? signupBonus?.deadline}
            />
          </View>
        )}

        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <Text
            className="text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
          >
            Quick Stats
          </Text>

          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="flex-row">
              <View className="flex-1 items-center py-2">
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 24 }}
                >
                  {stats.totalReferrals || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Total Referrals
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center py-2">
                <Text
                  className="text-amber-500"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 24 }}
                >
                  {stats.pendingReferrals || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Pending
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center py-2">
                <Text
                  className="text-green-500"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 24 }}
                >
                  {stats.rewardedReferrals || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Rewarded
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View className="px-6 mb-8">
          <Text
            className="text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
          >
            How It Works
          </Text>

          <View className="bg-blue-50 rounded-2xl p-4">
            {[
              {
                icon: 'share-outline',
                title: 'Share Your Code',
                description: 'Share your referral code with other providers',
              },
              {
                icon: 'person-add-outline',
                title: 'They Sign Up',
                description: 'They join using your code during registration',
              },
              {
                icon: 'briefcase-outline',
                title: 'They Get Qualified',
                description: 'Complete 5 jobs with 4.0+ rating within 60 days',
              },
              {
                icon: 'gift-outline',
                title: 'Both Earn Rewards',
                description: 'You both receive 300 XAF when qualified',
              },
            ].map((step, index) => (
              <View
                key={index}
                className={`flex-row items-start ${
                  index < 3 ? 'mb-4 pb-4 border-b border-blue-100' : ''
                }`}
              >
                <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                  <Ionicons name={step.icon} size={20} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    className="text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default IncentiveDashboardScreen;
