import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { BookingCard } from '../../components/bookings';
import { useNotifications } from '../../context/NotificationContext';
import { useSocketContext } from '../../context/SocketContext';
import cacheManager, { CACHE_KEYS, CACHE_TYPES } from '../../utils/cacheManager';

// Statuses requiring immediate provider action
const ACTION_REQUIRED_STATUSES = [
  'waiting_approval',  // Need to accept/reject assignment
  'waiting_quote',     // Need to send quote
  'paid',              // Ready to start - mark "on the way"
];

const ACTIVE_STATUSES = [
  'waiting_acceptance', // Quote sent, waiting for customer
  'on_the_way',
  'job_start_requested',
  'job_started',
  'job_complete_requested',
];

const BookingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { refreshTrigger } = useNotifications();
  const { isConnected, on, off } = useSocketContext();

  // Track last refresh trigger to prevent duplicate fetches
  const lastRefreshTriggerRef = useRef(0);

  const STATUS_FILTERS = [
    { key: 'all', label: t('bookings.filters.all') },
    { key: 'action_required', label: t('bookings.filters.action') },
    { key: 'active', label: t('bookings.filters.active') },
    { key: 'completed', label: t('bookings.filters.done') },
  ];

  // Memoized fetch function for bookings
  const fetchBookings = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Use deduplication to prevent duplicate requests
      const response = await cacheManager.deduplicatedFetch(
        `${CACHE_KEYS.BOOKINGS}:page${pageNum}`,
        () => apiService.get(`${API_ENDPOINTS.BOOKINGS}?page=${pageNum}&limit=20`)
      );

      if (response.success) {
        const newBookings = response.data || [];

        if (reset) {
          setBookings(newBookings);
          // Cache the first page for quick access
          cacheManager.set(CACHE_KEYS.BOOKINGS, newBookings);
        } else {
          setBookings((prev) => {
            const updated = [...prev, ...newBookings];
            // Update cache with all loaded bookings
            cacheManager.set(CACHE_KEYS.BOOKINGS, updated);
            return updated;
          });
        }

        setPage(pageNum);
        setHasMore(
          response.pagination?.page < response.pagination?.totalPages
        );
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Only fetch on focus if data is stale
  useFocusEffect(
    useCallback(() => {
      // Check if cache is stale
      if (cacheManager.isStale(CACHE_KEYS.BOOKINGS, CACHE_TYPES.BOOKINGS)) {
        fetchBookings(1, true);
      } else {
        // Use cached data
        const cached = cacheManager.get(CACHE_KEYS.BOOKINGS, CACHE_TYPES.BOOKINGS);
        if (cached && cached.length > 0) {
          setBookings(cached);
          setLoading(false);
        } else {
          fetchBookings(1, true);
        }
      }
    }, [fetchBookings])
  );

  useEffect(() => {
    // Only respond to new refresh triggers (debounced from NotificationContext)
    if (refreshTrigger > 0 && refreshTrigger !== lastRefreshTriggerRef.current) {
      lastRefreshTriggerRef.current = refreshTrigger;
      fetchBookings(1, true);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const handleStatusChange = (data) => {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === data.bookingId
            ? { ...booking, status: data.status, ...data }
            : booking
        )
      );
    };

    if (isConnected) {
      on('booking-status-changed', handleStatusChange);
    }

    // Cleanup should always try to remove, even if socket disconnected
    return () => {
      off('booking-status-changed', handleStatusChange);
    };
  }, [isConnected, on, off]);

  useEffect(() => {
    applyFilter();
  }, [bookings, selectedFilter]);

  const applyFilter = () => {
    let filtered = [...bookings];

    switch (selectedFilter) {
      case 'action_required':
        filtered = bookings.filter((b) => ACTION_REQUIRED_STATUSES.includes(b.status));
        break;
      case 'active':
        filtered = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
        break;
      case 'completed':
        filtered = bookings.filter((b) => b.status === 'completed');
        break;
      default:
        filtered = bookings;
    }

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchBookings(page + 1);
    }
  };

  const handleBookingPress = (booking) => {
    navigation.navigate('BookingDetails', { bookingId: booking.id });
  };

  const getFilterCount = (filterKey) => {
    switch (filterKey) {
      case 'action_required':
        return bookings.filter((b) => ACTION_REQUIRED_STATUSES.includes(b.status)).length;
      case 'active':
        return bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;
      case 'completed':
        return bookings.filter((b) => b.status === 'completed').length;
      default:
        return bookings.length;
    }
  };

  const getFilterLabel = (filterKey) => {
    switch (filterKey) {
      case 'action_required':
        return t('bookings.filters.action').toLowerCase();
      case 'active':
        return t('bookings.filters.active').toLowerCase();
      case 'completed':
        return t('bookings.filters.done').toLowerCase();
      default:
        return '';
    }
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-20 h-20 bg-gray-100 rounded-3xl items-center justify-center mb-4">
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
      </View>
      <Text
        className="text-gray-900 mt-2 text-center"
        style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
      >
        {selectedFilter === 'all' ? t('bookings.noBookings') : t('bookings.noFilteredBookings', { filter: getFilterLabel(selectedFilter) })}
      </Text>
      <Text
        className="text-gray-400 text-center mt-1"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
      >
        {t('bookings.newRequestsAppear')}
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
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-4 pb-6">
          <Text
            className="text-gray-900"
            style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
          >
            {t('bookings.title')}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text
          className="text-gray-900"
          style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
        >
          {t('bookings.title')}
        </Text>

        {/* Filter Pills */}
        <View className="flex-row mt-4">
          {STATUS_FILTERS.map((item) => {
            const isSelected = selectedFilter === item.key;
            const count = getFilterCount(item.key);

            return (
              <TouchableOpacity
                key={item.key}
                className={`mr-2 px-4 py-2 rounded-xl flex-row items-center ${
                  isSelected ? 'bg-primary' : 'bg-gray-100'
                }`}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(item.key)}
              >
                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 13,
                    color: isSelected ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {item.label}
                </Text>
                {count > 0 && item.key !== 'all' && (
                  <View
                    className={`ml-1.5 w-5 h-5 rounded-md items-center justify-center ${
                      isSelected ? 'bg-white/20' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: 10,
                        color: isSelected ? '#FFFFFF' : '#6B7280',
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard booking={item} onPress={() => handleBookingPress(item)} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 100,
          flexGrow: filteredBookings.length === 0 ? 1 : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default BookingsScreen;
