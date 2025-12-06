import React, { useState, useEffect, useCallback } from 'react';
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
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { BookingCard } from '../../components/bookings';
import { useNotifications } from '../../context/NotificationContext';
import { useSocketContext } from '../../context/SocketContext';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

const ACTIVE_STATUSES = [
  'accepted',
  'quotation_sent',
  'paid',
  'on_the_way',
  'job_start_requested',
  'job_started',
  'job_complete_requested',
];

const BookingsScreen = ({ navigation }) => {
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

  useFocusEffect(
    useCallback(() => {
      fetchBookings(1, true);
    }, [])
  );

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchBookings(1, true);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (isConnected) {
      on('booking-status-changed', (data) => {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === data.bookingId
              ? { ...booking, status: data.status, ...data }
              : booking
          )
        );
      });

      return () => {
        off('booking-status-changed');
      };
    }
  }, [isConnected, on, off]);

  useEffect(() => {
    applyFilter();
  }, [bookings, selectedFilter]);

  const fetchBookings = async (pageNum = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.get(
        `${API_ENDPOINTS.BOOKINGS}?page=${pageNum}&limit=20`
      );

      if (response.success) {
        const newBookings = response.data || [];

        if (reset) {
          setBookings(newBookings);
        } else {
          setBookings((prev) => [...prev, ...newBookings]);
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
  };

  const applyFilter = () => {
    let filtered = [...bookings];

    switch (selectedFilter) {
      case 'pending':
        filtered = bookings.filter((b) => b.status === 'pending');
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
      case 'pending':
        return bookings.filter((b) => b.status === 'pending').length;
      case 'active':
        return bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;
      case 'completed':
        return bookings.filter((b) => b.status === 'completed').length;
      default:
        return bookings.length;
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
        {selectedFilter === 'all' ? 'No bookings yet' : `No ${selectedFilter} bookings`}
      </Text>
      <Text
        className="text-gray-400 text-center mt-1"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
      >
        New requests will appear here
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
            Bookings
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
          Bookings
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
