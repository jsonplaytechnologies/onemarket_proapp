import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { StatusBadge } from '../../components/bookings';

// Generate 1-hour time slots from 6 AM to 10 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    slots.push({
      hour,
      minute: 0,
      label: `${hour.toString().padStart(2, '0')}:00`,
      endLabel: `${(hour + 1).toString().padStart(2, '0')}:00`,
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Buffer hours before and after jobs
const PRE_BUFFER_HOURS = 2;
const POST_BUFFER_HOURS = 2;

const MyScheduleScreen = ({ navigation }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedDate])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const dateStr = formatDateForApi(selectedDate);

      // Fetch bookings for selected date and availability settings
      const [bookingsRes, availRes] = await Promise.all([
        apiService.get(`${API_ENDPOINTS.BOOKINGS}?date=${dateStr}&limit=50`),
        apiService.get(API_ENDPOINTS.PRO_AVAILABILITY_GET),
      ]);

      if (bookingsRes.success) {
        setBookings(bookingsRes.data || []);
      }

      if (availRes.success && availRes.data) {
        setAvailability(availRes.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDateForApi = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === now.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if a time slot is within provider's availability
  const isSlotWithinAvailability = (slot) => {
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );

    if (!dayAvailability) return false;

    const slotTime = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}:00`;
    const slotEndTime = `${(slot.hour + 1).toString().padStart(2, '0')}:00:00`;

    return slotTime >= dayAvailability.start_time && slotEndTime <= dayAvailability.end_time;
  };

  // Get booking that occupies a time slot (including buffers)
  const getBookingForSlot = (slot) => {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(slot.hour, slot.minute, 0, 0);

    const slotEnd = new Date(selectedDate);
    slotEnd.setHours(slot.hour + 1, 0, 0, 0);

    for (const booking of bookings) {
      // Skip cancelled/failed bookings
      if (['cancelled', 'failed', 'rejected', 'quote_rejected', 'quote_expired'].includes(booking.status)) {
        continue;
      }

      const bookingTime = new Date(booking.requested_datetime || booking.created_at);
      const durationMinutes = booking.quoted_duration_minutes || 60;

      // Calculate job start and end with buffers
      const jobStart = new Date(bookingTime);
      const jobEnd = new Date(bookingTime);
      jobEnd.setMinutes(jobEnd.getMinutes() + durationMinutes);

      // Buffer times
      const bufferStart = new Date(jobStart);
      bufferStart.setHours(bufferStart.getHours() - PRE_BUFFER_HOURS);
      const bufferEnd = new Date(jobEnd);
      bufferEnd.setHours(bufferEnd.getHours() + POST_BUFFER_HOURS);

      // Check if slot overlaps with job time (actual job, not buffer)
      if (slotStart < jobEnd && slotEnd > jobStart) {
        return { booking, type: 'job' };
      }

      // Check if slot overlaps with pre-buffer
      if (slotStart < jobStart && slotEnd > bufferStart && slotStart >= bufferStart) {
        return { booking, type: 'pre-buffer' };
      }

      // Check if slot overlaps with post-buffer
      if (slotStart >= jobEnd && slotStart < bufferEnd) {
        return { booking, type: 'post-buffer' };
      }
    }

    return null;
  };

  // Check if slot is in the past
  const isSlotPast = (slot) => {
    const now = new Date();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (selectedDay.getTime() > todayDate.getTime()) {
      return false;
    }

    const slotDate = new Date(selectedDate);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    return slotDate <= now;
  };

  const getSlotInfo = (slot) => {
    if (isSlotPast(slot)) {
      return { status: 'past', booking: null };
    }

    const bookingInfo = getBookingForSlot(slot);
    if (bookingInfo) {
      return { status: bookingInfo.type, booking: bookingInfo.booking };
    }

    if (!isSlotWithinAvailability(slot)) {
      return { status: 'unavailable', booking: null };
    }

    return { status: 'available', booking: null };
  };

  const getSlotStyle = (status) => {
    const base = {
      flex: 1,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    };

    switch (status) {
      case 'job':
        return { ...base, backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#EF4444' };
      case 'pre-buffer':
      case 'post-buffer':
        return { ...base, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' };
      case 'available':
        return { ...base, backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' };
      case 'past':
      case 'unavailable':
      default:
        return { ...base, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' };
    }
  };

  const getSlotTextStyle = (status) => {
    switch (status) {
      case 'job':
        return { color: '#991B1B', fontFamily: 'Poppins-SemiBold', fontSize: 12 };
      case 'pre-buffer':
      case 'post-buffer':
        return { color: '#92400E', fontFamily: 'Poppins-Medium', fontSize: 11 };
      case 'available':
        return { color: '#166534', fontFamily: 'Poppins-Medium', fontSize: 12 };
      default:
        return { color: '#9CA3AF', fontFamily: 'Poppins-Regular', fontSize: 12 };
    }
  };

  const getSlotLabel = (status) => {
    switch (status) {
      case 'job':
        return 'BOOKED';
      case 'pre-buffer':
        return 'BUFFER';
      case 'post-buffer':
        return 'BUFFER';
      case 'available':
        return 'FREE';
      case 'past':
        return 'PAST';
      default:
        return 'OFF';
    }
  };

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Get active bookings for the day to show in list
  const activeBookings = bookings.filter(
    (b) => !['cancelled', 'failed', 'rejected', 'quote_rejected', 'quote_expired'].includes(b.status)
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              My Schedule
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              View your booked appointments
            </Text>
          </View>
        </View>
      </View>

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
        {/* Date Navigation */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              onPress={() => navigateDate(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 mx-4 items-center"
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                className="text-lg text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                {formatDate(selectedDate)}
              </Text>
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {formatFullDate(selectedDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              onPress={() => navigateDate(1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Quick date buttons */}
          <View className="flex-row mt-4 space-x-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${
                formatDate(selectedDate) === 'Today' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedDate(new Date())}
            >
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  fontSize: 13,
                  color: formatDate(selectedDate) === 'Today' ? COLORS.primary : '#6B7280',
                }}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${
                formatDate(selectedDate) === 'Tomorrow' ? 'bg-blue-100' : 'bg-gray-100'
              }`}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  fontSize: 13,
                  color: formatDate(selectedDate) === 'Tomorrow' ? COLORS.primary : '#6B7280',
                }}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {/* Legend */}
        <View className="flex-row items-center justify-center px-4 mt-4 mb-2">
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 rounded bg-red-200 mr-1" />
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
              Booked
            </Text>
          </View>
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 rounded bg-yellow-200 mr-1" />
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
              Buffer
            </Text>
          </View>
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 rounded bg-green-200 mr-1" />
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
              Available
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded bg-gray-200 mr-1" />
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'Poppins-Regular' }}>
              Off
            </Text>
          </View>
        </View>

        {/* Time Slots Grid */}
        <View className="bg-white mx-4 mt-2 rounded-2xl p-4">
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                className="text-gray-500 mt-2"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
              >
                Loading schedule...
              </Text>
            </View>
          ) : (
            <View>
              {TIME_SLOTS.map((slot, index) => {
                const slotInfo = getSlotInfo(slot);
                const { status, booking } = slotInfo;

                return (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center mb-2"
                    activeOpacity={booking ? 0.7 : 1}
                    onPress={() => {
                      if (booking) {
                        navigation.navigate('BookingDetails', { bookingId: booking.id });
                      }
                    }}
                  >
                    {/* Time Label */}
                    <View className="w-16">
                      <Text
                        className="text-gray-600"
                        style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
                      >
                        {slot.label}
                      </Text>
                    </View>

                    {/* Slot Block */}
                    <View style={getSlotStyle(status)}>
                      <Text style={getSlotTextStyle(status)}>
                        {getSlotLabel(status)}
                      </Text>
                      {booking && status === 'job' && (
                        <Text
                          className="text-red-700"
                          style={{ fontFamily: 'Poppins-Regular', fontSize: 10 }}
                          numberOfLines={1}
                        >
                          {booking.service_name}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Bookings List for the Day */}
        {activeBookings.length > 0 && (
          <View className="mx-4 mt-6 mb-8">
            <Text
              className="text-gray-900 mb-3"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
            >
              Appointments ({activeBookings.length})
            </Text>

            {activeBookings.map((booking) => {
              const bookingTime = new Date(booking.requested_datetime || booking.created_at);
              const durationMinutes = booking.quoted_duration_minutes || 60;
              const endTime = new Date(bookingTime);
              endTime.setMinutes(endTime.getMinutes() + durationMinutes);

              return (
                <TouchableOpacity
                  key={booking.id}
                  className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                      <Text
                        className="text-gray-900 ml-2"
                        style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
                      >
                        {bookingTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {endTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <StatusBadge status={booking.status} size="small" />
                  </View>

                  <Text
                    className="text-gray-700"
                    style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                  >
                    {booking.service_name}
                  </Text>

                  <View className="flex-row items-center mt-2">
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text
                      className="text-gray-500 ml-1"
                      style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                    >
                      {booking.user_first_name} {booking.user_last_name || ''}
                    </Text>
                  </View>

                  {booking.zone_name && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text
                        className="text-gray-500 ml-1"
                        style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                      >
                        {booking.zone_name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* No bookings message */}
        {!loading && activeBookings.length === 0 && (
          <View className="mx-4 mt-6 mb-8 bg-gray-100 rounded-2xl p-8 items-center">
            <View className="w-16 h-16 bg-gray-200 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            </View>
            <Text
              className="text-gray-500 text-center"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              No appointments scheduled for this day
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyScheduleScreen;
