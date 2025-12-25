import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { BookingCard, RankingStatsCard } from '../../components/bookings';
import Logo from '../../components/common/Logo';

const HomeScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const { unreadCount, refreshTrigger } = useNotifications();

  const [earnings, setEarnings] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [rankingStats, setRankingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger]);

  const fetchData = async () => {
    try {
      const [earningsRes, bookingsRes, rankingRes] = await Promise.all([
        apiService.get(`${API_ENDPOINTS.EARNINGS}?period=today`),
        apiService.get(`${API_ENDPOINTS.BOOKINGS}?limit=5`),
        apiService.get(API_ENDPOINTS.MY_RANKING).catch(() => ({ success: false })),
      ]);

      if (earningsRes.success) {
        setEarnings(earningsRes.data);
      }

      if (bookingsRes.success) {
        setRecentBookings(bookingsRes.data || []);
      }

      if (rankingRes.success && rankingRes.data) {
        setRankingStats(rankingRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  const firstName = user?.profile?.first_name || user?.first_name || 'Pro';

  // Show bookings requiring action
  const ACTION_REQUIRED_STATUSES = ['waiting_approval', 'waiting_quote', 'paid'];
  const actionRequiredBookings = recentBookings.filter((b) =>
    ACTION_REQUIRED_STATUSES.includes(b.status)
  );

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
          <View className="mb-6">
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
            </Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 26 }}
            >
              {firstName}
            </Text>
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
                Today's Earnings
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

            <View className="flex-row">
              <View className="flex-1">
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
                >
                  Available
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
                >
                  {formatCurrency(earnings?.wallet?.availableBalance || 0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
                >
                  Pending
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
                >
                  {formatCurrency(earnings?.wallet?.pendingBalance || 0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
                >
                  Jobs
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
                >
                  {earnings?.breakdown?.totalJobs || 0}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between">
            {[
              { icon: 'calendar-outline', label: 'Bookings', screen: 'Bookings' },
              { icon: 'wallet-outline', label: 'Wallet', screen: 'Earnings' },
              { icon: 'construct-outline', label: 'Services', screen: 'MyServices' },
              { icon: 'location-outline', label: 'Zones', screen: 'MyZones' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
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
                Action Required
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
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text
                className="text-primary"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                See All
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
                No bookings yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
