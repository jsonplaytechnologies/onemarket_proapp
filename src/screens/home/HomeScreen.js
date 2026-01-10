import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { BookingCard, RankingStatsCard } from '../../components/bookings';
import Logo from '../../components/common/Logo';
import cacheManager, { CACHE_KEYS, CACHE_TYPES } from '../../utils/cacheManager';
import { TierBadge, ReferralCodeCard } from '../../components/incentives';
import { useIncentive } from '../../context/IncentiveContext';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser, fetchUserProfile, isProfileStale } = useAuth();
  const { unreadCount, refreshTrigger } = useNotifications();
  const {
    tierStatus,
    referralCode,
    referralStats,
    fetchDashboard,
    shareReferralCode,
  } = useIncentive();

  const [earnings, setEarnings] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [rankingStats, setRankingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  // Track last refresh trigger to prevent duplicate fetches
  const lastRefreshTriggerRef = useRef(0);

  // Sync online status from user context
  useEffect(() => {
    if (user?.profile?.is_online !== undefined) {
      setIsOnline(user.profile.is_online);
    } else if (user?.is_online !== undefined) {
      setIsOnline(user.is_online);
    }
  }, [user]);

  // Memoized fetch function for dashboard data
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Use deduplication to prevent multiple simultaneous requests
      const [earningsRes, bookingsRes, rankingRes] = await Promise.all([
        cacheManager.deduplicatedFetch(
          CACHE_KEYS.EARNINGS_TODAY,
          () => apiService.get(`${API_ENDPOINTS.EARNINGS}?period=today`)
        ),
        cacheManager.deduplicatedFetch(
          CACHE_KEYS.BOOKINGS,
          () => apiService.get(`${API_ENDPOINTS.BOOKINGS}?limit=5`)
        ),
        cacheManager.deduplicatedFetch(
          CACHE_KEYS.RANKING,
          () => apiService.get(API_ENDPOINTS.MY_RANKING).catch(() => ({ success: false }))
        ),
      ]);

      if (earningsRes.success) {
        setEarnings(earningsRes.data);
        cacheManager.set(CACHE_KEYS.EARNINGS_TODAY, earningsRes.data);
      }

      if (bookingsRes.success) {
        const bookings = bookingsRes.data || [];
        setRecentBookings(bookings);
        cacheManager.set(CACHE_KEYS.BOOKINGS, bookings);
      }

      if (rankingRes.success && rankingRes.data) {
        setRankingStats(rankingRes.data);
        cacheManager.set(CACHE_KEYS.RANKING, rankingRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data only if cache is stale
  const fetchDataIfStale = useCallback(async () => {
    const earningsStale = cacheManager.isStale(CACHE_KEYS.EARNINGS_TODAY, CACHE_TYPES.EARNINGS);
    const bookingsStale = cacheManager.isStale(CACHE_KEYS.BOOKINGS, CACHE_TYPES.BOOKINGS);
    const rankingStale = cacheManager.isStale(CACHE_KEYS.RANKING, CACHE_TYPES.RANKING);

    // If all data is cached and fresh, use it
    if (!earningsStale && !bookingsStale && !rankingStale) {
      const cachedEarnings = cacheManager.get(CACHE_KEYS.EARNINGS_TODAY, CACHE_TYPES.EARNINGS);
      const cachedBookings = cacheManager.get(CACHE_KEYS.BOOKINGS, CACHE_TYPES.BOOKINGS);
      const cachedRanking = cacheManager.get(CACHE_KEYS.RANKING, CACHE_TYPES.RANKING);

      if (cachedEarnings) setEarnings(cachedEarnings);
      if (cachedBookings) setRecentBookings(cachedBookings);
      if (cachedRanking) setRankingStats(cachedRanking);
      setLoading(false);
      return;
    }

    // Fetch stale data
    await fetchData(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      // Only fetch if data is stale
      fetchDataIfStale();
      // Use cached profile instead of separate API call
      if (isProfileStale()) {
        fetchUserProfile();
      }
      // Fetch incentive data
      fetchDashboard();
    }, [fetchDataIfStale, isProfileStale, fetchUserProfile, fetchDashboard])
  );

  useEffect(() => {
    // Only respond to new refresh triggers (debounced from NotificationContext)
    if (refreshTrigger > 0 && refreshTrigger !== lastRefreshTriggerRef.current) {
      lastRefreshTriggerRef.current = refreshTrigger;
      fetchData(true); // Force refresh on notification
    }
  }, [refreshTrigger, fetchData]);

  const toggleOnlineStatus = async (newStatus) => {
    try {
      setTogglingOnline(true);
      setIsOnline(newStatus); // Optimistic update

      const response = await apiService.patch(API_ENDPOINTS.PRO_ONLINE_TOGGLE, {
        is_online: newStatus
      });

      if (response.success) {
        setIsOnline(response.data.is_online);
        // Update user context to keep profile in sync
        if (user) {
          const updatedUser = {
            ...user,
            is_online: response.data.is_online,
            profile: user.profile ? { ...user.profile, is_online: response.data.is_online } : undefined
          };
          updateUser(updatedUser);
          // Invalidate profile cache so it gets refreshed
          cacheManager.invalidate(CACHE_KEYS.PROFILE);
        }
      } else {
        setIsOnline(!newStatus); // Revert on failure
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
      setIsOnline(!newStatus); // Revert on error
    } finally {
      setTogglingOnline(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh on pull-to-refresh
    await fetchData(true);
    setRefreshing(false);
  };

  const formatCurrency = (amount, compact = false) => {
    if (!amount && amount !== 0) return '0 XAF';
    if (compact && amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M XAF`;
    }
    if (compact && amount >= 100000) {
      return `${Math.round(amount / 1000)}K XAF`;
    }
    return `${amount.toLocaleString()} XAF`;
  };

  const firstName = user?.profile?.first_name || user?.first_name || 'Pro';

  // Show bookings requiring action
  const ACTION_REQUIRED_STATUSES = ['waiting_approval', 'waiting_quote', 'paid'];
  const actionRequiredBookings = recentBookings.filter((b) =>
    ACTION_REQUIRED_STATUSES.includes(b.status)
  );

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 17) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
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
          <View className="flex-row items-center justify-between mb-6">
            <Logo size={40} showText={false} />
            <TouchableOpacity
              className="relative w-11 h-11 bg-gray-50 rounded-xl items-center justify-center"
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#1F2937" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center">
                  <Text className="text-white text-xs" style={{ fontFamily: 'Poppins-SemiBold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View className="mb-4">
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              {getGreeting()}
            </Text>
            <View className="flex-row items-center">
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 26 }}
              >
                {firstName}
              </Text>
              {tierStatus?.tier && (
                <View className="ml-2">
                  <TierBadge
                    tier={tierStatus.tier}
                    size="small"
                    showBonus
                  />
                </View>
              )}
            </View>
          </View>

          {/* Online Status Toggle */}
          <View className={`rounded-2xl p-4 mb-2 flex-row items-center justify-between ${isOnline ? 'bg-green-50' : 'bg-gray-100'}`}>
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isOnline ? 'bg-green-100' : 'bg-gray-200'}`}>
                <Ionicons
                  name={isOnline ? 'flash' : 'flash-outline'}
                  size={20}
                  color={isOnline ? '#16A34A' : '#6B7280'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={isOnline ? 'text-green-800' : 'text-gray-700'}
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
                >
                  {isOnline ? t('home.online.youAreOnline') : t('home.online.youAreOffline')}
                </Text>
                <Text
                  className={isOnline ? 'text-green-600' : 'text-gray-500'}
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {isOnline ? t('home.online.acceptingBookNow') : t('home.online.toggleToAccept')}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              disabled={togglingOnline}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isOnline ? '#16A34A' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Earnings Card */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-2xl p-5"
            onPress={() => navigation.navigate('Earnings')}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-white/70"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
              >
                {t('home.earnings.todaysEarnings')}
              </Text>
              <View className="bg-white/20 rounded-lg px-2 py-1">
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </View>

            <Text
              className="text-white mb-5"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 32 }}
            >
              {formatCurrency(earnings?.breakdown?.netEarnings || 0)}
            </Text>

            <View className="flex-row bg-white/10 rounded-xl p-3">
              <View className="flex-1 items-center border-r border-white/20">
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 16 }}
                  numberOfLines={1}
                >
                  {formatCurrency(earnings?.wallet?.availableBalance || 0, true)}
                </Text>
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
                >
                  {t('home.earnings.wallet')}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 16 }}
                >
                  {earnings?.breakdown?.totalJobs || 0}
                </Text>
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
                >
                  {t('home.earnings.jobsDone')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between">
            {[
              { icon: 'calendar-outline', label: t('home.quickActions.schedule'), screen: 'MySchedule' },
              { icon: 'briefcase-outline', label: t('home.quickActions.bookings'), screen: 'Bookings' },
              { icon: 'wallet-outline', label: t('home.quickActions.wallet'), screen: 'Earnings' },
              { icon: 'construct-outline', label: t('home.quickActions.services'), screen: 'MyServices' },
            ].map((action) => (
              <TouchableOpacity
                key={action.screen}
                className="items-center"
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.7}
              >
                <View className="w-14 h-14 bg-gray-50 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name={action.icon} size={24} color="#2563EB" />
                </View>
                <Text
                  className="text-gray-600"
                  style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Referral Quick Access */}
        {referralCode?.code && (
          <View className="px-6 mb-6">
            <TouchableOpacity
              onPress={() => navigation.navigate('IncentiveDashboard')}
              activeOpacity={0.9}
            >
              <ReferralCodeCard
                code={referralCode.code}
                totalUses={referralCode.totalUses || referralStats?.stats?.totalReferrals || 0}
                totalEarned={referralStats?.stats?.totalRewardsEarned || 0}
                onShare={shareReferralCode}
                compact
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 2: Ranking Stats Card */}
        {rankingStats && (
          <View className="px-6 mb-6">
            <RankingStatsCard stats={rankingStats} />
          </View>
        )}

        {/* Phase 2: Action Required Bookings */}
        {actionRequiredBookings.length > 0 && (
          <View className="px-6 mb-6">
            <View className="flex-row items-center mb-4">
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
              >
                {t('home.actionRequired')}
              </Text>
              <View className="bg-red-500 ml-2 w-6 h-6 rounded-full items-center justify-center">
                <Text className="text-white text-xs" style={{ fontFamily: 'Poppins-Bold' }}>
                  {actionRequiredBookings.length}
                </Text>
              </View>
            </View>

            {actionRequiredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              />
            ))}
          </View>
        )}

        {/* Recent Bookings */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
            >
              {t('home.recentActivity')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text
                className="text-primary"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {t('home.seeAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length > 0 ? (
            recentBookings.slice(0, 3).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              />
            ))
          ) : (
            <View className="bg-gray-50 rounded-2xl p-8 items-center">
              <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              </View>
              <Text
                className="text-gray-400"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                {t('home.noBookingsYet')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
