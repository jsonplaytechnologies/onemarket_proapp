import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useIncentive } from '../../context/IncentiveContext';
import { COLORS } from '../../constants/colors';
import {
  ReferralCodeCard,
  ReferralPartnerCard,
} from '../../components/incentives';

const ReferralsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    referralCode,
    referralStats,
    referralList,
    referralPagination,
    loading,
    refreshing,
    fetchReferralCode,
    fetchReferralStats,
    fetchReferralList,
    loadMoreReferrals,
    shareReferralCode,
  } = useIncentive();

  const [initialLoading, setInitialLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setInitialLoading(true);
        await Promise.all([
          fetchReferralCode(true),
          fetchReferralStats(true),
          fetchReferralList(1, true),
        ]);
        setInitialLoading(false);
      };
      loadData();
    }, [fetchReferralCode, fetchReferralStats, fetchReferralList])
  );

  const onRefresh = async () => {
    await Promise.all([
      fetchReferralCode(true),
      fetchReferralStats(true),
      fetchReferralList(1, true),
    ]);
  };

  const stats = referralStats?.stats || referralStats || {};
  const code = referralCode?.code || referralStats?.referralCode?.code;
  const totalUses = referralCode?.totalUses || referralStats?.referralCode?.totalUses || 0;
  const totalEarned = stats.totalRewardsEarned || 0;

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  const renderReferralItem = ({ item }) => (
    <ReferralPartnerCard
      referral={item}
      onPress={() => navigation.navigate('ReferralDetails', { referral: item })}
    />
  );

  const renderHeader = () => (
    <>
      {/* Header */}
      <View className="px-3 pt-4 pb-6">
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
            {t('referrals.title')}
          </Text>
        </View>

        {/* Referral Code Card */}
        <ReferralCodeCard
          code={code}
          totalUses={totalUses}
          totalEarned={totalEarned}
          onShare={shareReferralCode}
        />
      </View>

      {/* Stats Summary */}
      <View className="px-3 mb-6">
        <View className="bg-gray-50 rounded-2xl p-4">
          <View className="flex-row">
            <View className="flex-1 items-center py-2 border-r border-gray-200">
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
              >
                {stats.totalReferrals || 0}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                {t('referrals.total')}
              </Text>
            </View>
            <View className="flex-1 items-center py-2 border-r border-gray-200">
              <Text
                className="text-amber-500"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
              >
                {stats.pendingReferrals || 0}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                {t('referrals.pending')}
              </Text>
            </View>
            <View className="flex-1 items-center py-2 border-r border-gray-200">
              <Text
                className="text-blue-500"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
              >
                {stats.qualifiedReferrals || 0}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                {t('referrals.qualified')}
              </Text>
            </View>
            <View className="flex-1 items-center py-2">
              <Text
                className="text-green-500"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
              >
                {stats.rewardedReferrals || 0}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                {t('referrals.rewarded')}
              </Text>
            </View>
          </View>

          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-gray-600"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {t('referrals.totalEarned')}
              </Text>
              <Text
                className="text-green-600"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
              >
                {formatCurrency(totalEarned)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Referrals List Header */}
      <View className="px-3 mb-3">
        <Text
          className="text-gray-900"
          style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
        >
          {t('referrals.yourReferrals')}
        </Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View className="px-3 py-12 items-center">
      <View className="w-20 h-20 bg-gray-100 rounded-2xl items-center justify-center mb-4">
        <Ionicons name="people-outline" size={40} color="#9CA3AF" />
      </View>
      <Text
        className="text-gray-700 mb-2"
        style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
      >
        {t('referrals.noReferralsYet')}
      </Text>
      <Text
        className="text-gray-400 text-center mb-6"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
      >
        {t('referrals.noReferralsDesc')}
      </Text>
      <TouchableOpacity
        onPress={shareReferralCode}
        className="bg-primary rounded-xl px-6 py-3 flex-row items-center"
        activeOpacity={0.7}
      >
        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
        <Text
          className="text-white ml-2"
          style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
        >
          {t('referrals.shareYourCode')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!referralPagination.hasMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-3 pt-4">
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
      <FlatList
        data={referralList}
        renderItem={renderReferralItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMoreReferrals}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

export default ReferralsScreen;
