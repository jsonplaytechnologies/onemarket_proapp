import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const TransactionsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchTransactions(1, true);
  }, []);

  const fetchTransactions = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.get(
        `${API_ENDPOINTS.TRANSACTIONS}?page=${pageNum}&limit=20`
      );

      if (response.success) {
        const newTransactions = response.data || [];

        if (reset) {
          setTransactions(newTransactions);
        } else {
          setTransactions((prev) => [...prev, ...newTransactions]);
        }

        setPage(pageNum);
        setHasMore(
          response.pagination?.page < response.pagination?.totalPages
        );
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(page + 1);
    }
  };

  const formatCurrency = (amount, isPositive) => {
    if (!amount && amount !== 0) return '0 XAF';
    const prefix = isPositive ? '+' : '-';
    return `${prefix}${Math.abs(amount).toLocaleString()} XAF`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earning':
      case 'credit':
        return { name: 'arrow-down', color: COLORS.success, bg: 'bg-green-100' };
      case 'withdrawal':
      case 'debit':
        return { name: 'arrow-up', color: COLORS.error, bg: 'bg-red-100' };
      case 'commission':
        return { name: 'remove', color: COLORS.warning, bg: 'bg-yellow-100' };
      default:
        return { name: 'swap-horizontal', color: COLORS.primary, bg: 'bg-blue-100' };
    }
  };

  const renderTransaction = ({ item }) => {
    const icon = getTransactionIcon(item.type);
    const isPositive = item.type === 'credit' || item.type === 'earning';

    return (
      <TouchableOpacity
        className="flex-row items-center bg-white px-4 py-4 border-b border-gray-100"
        activeOpacity={0.7}
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${icon.bg}`}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-medium text-gray-900"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {item.type === 'earning' || item.type === 'credit'
              ? t('transactions.jobCompleted')
              : item.type === 'withdrawal' || item.type === 'debit'
              ? t('transactions.withdrawal')
              : item.type === 'commission'
              ? t('transactions.platformFee')
              : t('transactions.transaction')}
          </Text>
          <Text
            className="text-sm text-gray-500"
            style={{ fontFamily: 'Poppins-Regular' }}
            numberOfLines={1}
          >
            {item.description || formatDate(item.created_at)}
          </Text>
        </View>

        <Text
          className={`text-base font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-500'
          }`}
          style={{ fontFamily: 'Poppins-SemiBold' }}
        >
          {formatCurrency(item.amount, isPositive)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text
        className="text-xl font-semibold text-gray-900 mt-4 text-center"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        {t('transactions.noTransactions')}
      </Text>
      <Text
        className="text-base text-gray-500 text-center mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        {t('transactions.historyAppearHere')}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
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
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            {t('transactions.title')}
          </Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          flexGrow: transactions.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default TransactionsScreen;
