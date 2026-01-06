import React, { useState, useEffect } from 'react';
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
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { TierBadge } from '../../components/incentives';
import { useIncentive } from '../../context/IncentiveContext';
import { formatBonusRate } from '../../services/incentiveService';


const EarningsScreen = ({ navigation }) => {
  const { tierStatus, fetchTierStatus } = useIncentive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(null);

  const currentTier = tierStatus?.tier || 'starter';
  const bonusRate = tierStatus?.bonusRate || 0;

  useEffect(() => {
    fetchEarnings();
    fetchTierStatus();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.EARNINGS}?period=all`
      );
      if (response.success) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  if (loading) {
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
              Earnings
            </Text>
          </View>

          {/* Balance Card */}
          <View className="bg-primary rounded-2xl p-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-white/70"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
              >
                Available Balance
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Tier')}
                activeOpacity={0.7}
              >
                <TierBadge tier={currentTier} size="small" showBonus />
              </TouchableOpacity>
            </View>
            <Text
              className="text-white mt-1"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 36 }}
            >
              {formatCurrency(earnings?.wallet?.availableBalance)}
            </Text>

            <View className="flex-row mt-5 pt-5 border-t border-white/20">
              <View className="flex-1">
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
                >
                  Total Earned
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                >
                  {formatCurrency(earnings?.wallet?.totalEarnings)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-white/60"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
                >
                  Withdrawn
                </Text>
                <Text
                  className="text-white"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                >
                  {formatCurrency(earnings?.wallet?.totalWithdrawn)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tier Bonus Info */}
        {bonusRate > 0 && (
          <View className="px-6 mb-4">
            <TouchableOpacity
              className="bg-green-50 rounded-2xl p-4 flex-row items-center"
              onPress={() => navigation.navigate('Tier')}
              activeOpacity={0.7}
            >
              <View className="w-11 h-11 bg-green-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="trending-up" size={22} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-green-800"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                >
                  +{formatBonusRate(bonusRate)} Tier Bonus Active
                </Text>
                <Text
                  className="text-green-600"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  You earn extra on every job
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#16A34A" />
            </TouchableOpacity>
          </View>
        )}

        {/* Withdraw Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between"
            onPress={() => navigation.navigate('Withdrawals')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-11 h-11 bg-emerald-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="wallet-outline" size={22} color="#059669" />
              </View>
              <View>
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Medium', fontSize: 15 }}
                >
                  Withdraw
                </Text>
                <Text
                  className="text-gray-400"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  Mobile money or bank
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Earnings Summary */}
        <View className="px-6 mb-4">
          <View className="bg-gray-50 rounded-2xl p-5">
            <Text
              className="text-gray-400 mb-4"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 11, letterSpacing: 1 }}
            >
              SUMMARY
            </Text>

            <View className="flex-row justify-between mb-4">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                Total Jobs
              </Text>
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              >
                {earnings?.breakdown?.totalJobs || 0}
              </Text>
            </View>

            <View className="flex-row justify-between mb-4">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                Gross Earnings
              </Text>
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              >
                {formatCurrency(earnings?.breakdown?.totalEarnings)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-4">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                Commission
              </Text>
              <Text
                className="text-red-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                -{formatCurrency(earnings?.breakdown?.totalCommission)}
              </Text>
            </View>

            <View className="flex-row justify-between pt-4 border-t border-gray-200">
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
              >
                Net Earnings
              </Text>
              <Text
                className="text-emerald-600"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
              >
                {formatCurrency(earnings?.breakdown?.netEarnings)}
              </Text>
            </View>
          </View>
        </View>

        {/* Earnings by Service */}
        {earnings?.breakdown?.byService && earnings.breakdown.byService.length > 0 && (
          <View className="px-6 mb-4">
            <View className="bg-gray-50 rounded-2xl p-5">
              <Text
                className="text-gray-400 mb-4"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 11, letterSpacing: 1 }}
              >
                BY SERVICE
              </Text>

              {earnings.breakdown.byService.map((service, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between items-center py-3 ${
                    index < earnings.breakdown.byService.length - 1
                      ? 'border-b border-gray-200'
                      : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className="text-gray-900"
                      style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                    >
                      {service.serviceName}
                    </Text>
                    <Text
                      className="text-gray-400"
                      style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                    >
                      {service.jobCount} job{service.jobCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                  >
                    {formatCurrency(service.earnings)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transaction History Link */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            className="bg-gray-50 rounded-2xl p-4 flex-row items-center justify-between"
            onPress={() => navigation.navigate('Transactions')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-11 h-11 bg-blue-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="receipt-outline" size={22} color="#2563EB" />
              </View>
              <Text
                className="text-gray-900"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 15 }}
              >
                Transaction History
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;
