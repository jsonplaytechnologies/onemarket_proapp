import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService, { ApiError } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import {
  StatusBadge,
  TimeoutCountdown,
  BookNowBadge,
  CustomerAnswersCard,
  QuoteFormModal
} from '../../components/bookings';
import Button from '../../components/common/Button';
import { useBookingSocket } from '../../hooks/useSocket';

const BookingDetailsScreen = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [answers, setAnswers] = useState([]);

  const { bookingStatus } = useBookingSocket(bookingId);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (bookingStatus) {
      setBooking((prev) => ({ ...prev, ...bookingStatus }));
    }
  }, [bookingStatus]);

  const fetchBookingDetails = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_DETAILS(bookingId));
      if (response.success) {
        setBooking(response.data);
        // Fetch answers for Phase 2 bookings
        if (['waiting_approval', 'waiting_quote', 'waiting_acceptance'].includes(response.data?.status)) {
          fetchBookingAnswers();
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingAnswers = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_ANSWERS(bookingId));
      if (response.success && response.data) {
        setAnswers(response.data.answers || []);
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  // Phase 2: Accept Assignment
  const handleAcceptAssignment = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_ACCEPT_ASSIGNMENT(bookingId));
      Alert.alert('Success', 'Assignment accepted! Discuss scope with customer before sending quote.');
      fetchBookingDetails();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to accept assignment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Phase 2: Reject Assignment
  const handleRejectAssignment = async () => {
    if (!rejectReason) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_REJECT_ASSIGNMENT(bookingId), {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      Alert.alert('Assignment Rejected', 'The booking has been rejected and reassigned.');
      navigation.goBack();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to reject assignment');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Phase 2: Send Quote with Duration
  const handleSendQuote = async (amount, durationMinutes) => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_QUOTE(bookingId), {
        amount,
        durationMinutes,
      });
      setShowQuotationModal(false);
      Alert.alert('Success', 'Quote sent to customer');
      fetchBookingDetails();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to send quote');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnTheWay = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_ON_THE_WAY(bookingId));
      Alert.alert('Success', 'Customer notified that you are on the way');
      fetchBookingDetails();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to update status');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestStart = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_START(bookingId));
      Alert.alert('Success', 'Job start request sent. Waiting for customer confirmation.');
      fetchBookingDetails();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to request job start');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestComplete = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_COMPLETE(bookingId));
      Alert.alert('Success', 'Completion request sent. Waiting for customer confirmation.');
      fetchBookingDetails();
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          'Please Wait',
          `Too many requests. Try again in ${error.retryAfter} seconds.`
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', error.message || 'Failed to request completion');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallCustomer = () => {
    if (booking?.user_phone) {
      Linking.openURL(`tel:${booking.user_phone}`);
    }
  };

  const handleOpenMaps = () => {
    if (booking?.user_lat && booking?.user_lng) {
      const url = `https://maps.google.com/?q=${booking.user_lat},${booking.user_lng}`;
      Linking.openURL(url);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `${amount.toLocaleString()} XAF`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActionButtons = () => {
    const status = booking?.status;

    switch (status) {
      // Phase 2: New Assignment - waiting_approval
      case 'waiting_approval':
        return (
          <View>
            {/* Show customer's answers if available */}
            {answers.length > 0 && <CustomerAnswersCard answers={answers} />}

            <View className="flex-row space-x-3">
              <View className="flex-1 mr-2">
                <Button
                  title="Accept"
                  onPress={handleAcceptAssignment}
                  loading={actionLoading}
                  variant="success"
                  icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Reject"
                  onPress={() => setShowRejectModal(true)}
                  variant="danger"
                  icon={<Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />}
                />
              </View>
            </View>
          </View>
        );

      // Phase 2: Send Quote - waiting_quote
      case 'waiting_quote':
        return (
          <View>
            {/* Show customer's answers */}
            {answers.length > 0 && <CustomerAnswersCard answers={answers} />}

            {/* Chat Guidance */}
            <View className="bg-blue-50 p-4 rounded-xl mb-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={22} color="#1D4ED8" />
                <Text
                  className="text-blue-800 ml-3 flex-1"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  Discuss the job scope and price with the customer in chat before sending your quote.
                  You can only send one quote - make it count!
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <View className="flex-1 mr-2">
                <Button
                  title="Chat"
                  onPress={() => navigation.navigate('Chat', { bookingId, booking })}
                  variant="secondary"
                  icon={<Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Send Quote"
                  onPress={() => setShowQuotationModal(true)}
                  icon={<Ionicons name="document-text-outline" size={20} color="#FFFFFF" />}
                />
              </View>
            </View>
          </View>
        );

      // Phase 2: Waiting for customer to accept quote - waiting_acceptance
      case 'waiting_acceptance':
        return (
          <View className="bg-indigo-50 p-5 rounded-xl">
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={24} color="#4F46E5" />
              <Text
                className="text-indigo-800 ml-2"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
              >
                Waiting for Customer
              </Text>
            </View>

            <View className="border-t border-indigo-200 pt-3 mt-2">
              <Text
                className="text-indigo-700 mb-1"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
              >
                Your Quote
              </Text>
              <View className="flex-row items-baseline">
                <Text
                  className="text-indigo-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
                >
                  {formatCurrency(booking.quotation_amount)}
                </Text>
                {booking.quoted_duration_minutes && (
                  <Text
                    className="text-indigo-600 ml-3"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
                  >
                    ({Math.floor(booking.quoted_duration_minutes / 60)}h {booking.quoted_duration_minutes % 60}m)
                  </Text>
                )}
              </View>
            </View>

            <Text
              className="text-indigo-600 text-center mt-4"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              Customer has been notified of your quote
            </Text>
          </View>
        );

      case 'paid':
        return (
          <Button
            title="I'm On The Way"
            onPress={handleOnTheWay}
            loading={actionLoading}
            icon={<Ionicons name="navigate-outline" size={20} color="#FFFFFF" />}
          />
        );

      case 'on_the_way':
        return (
          <Button
            title="Request Job Start"
            onPress={handleRequestStart}
            loading={actionLoading}
            icon={<Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />}
          />
        );

      case 'job_start_requested':
        return (
          <View className="bg-yellow-50 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="time" size={24} color={COLORS.warning} />
              <Text
                className="text-yellow-800 ml-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Waiting for customer to confirm job start
              </Text>
            </View>
          </View>
        );

      case 'job_started':
        return (
          <Button
            title="Request Job Completion"
            onPress={handleRequestComplete}
            loading={actionLoading}
            icon={<Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />}
          />
        );

      case 'job_complete_requested':
        return (
          <View className="bg-yellow-50 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="time" size={24} color={COLORS.warning} />
              <Text
                className="text-yellow-800 ml-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Waiting for customer to confirm completion
              </Text>
            </View>
          </View>
        );

      case 'completed':
        return (
          <View className="bg-green-50 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text
                className="text-green-800 ml-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Job completed! Earnings credited to your wallet.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Booking not found</Text>
      </View>
    );
  }

  const userName = booking.user_first_name
    ? `${booking.user_first_name} ${booking.user_last_name || ''}`
    : 'Customer';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                Booking Details
              </Text>
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {booking.booking_number}
              </Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>
        </View>

        {/* Customer Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
          <Text
            className="text-sm text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            CUSTOMER
          </Text>
          <View className="flex-row items-center">
            {booking.user_avatar ? (
              <Image
                source={{ uri: booking.user_avatar }}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
            )}
            <View className="flex-1">
              <Text
                className="text-base font-medium text-gray-900"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {userName}
              </Text>
              {['paid', 'on_the_way', 'job_start_requested', 'job_started', 'job_complete_requested', 'completed'].includes(booking.status) ? (
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {booking.user_phone}
                </Text>
              ) : null}
            </View>
            {booking.user_phone && ['paid', 'on_the_way', 'job_start_requested', 'job_started', 'job_complete_requested'].includes(booking.status) && (
              <TouchableOpacity
                className="bg-green-100 p-2 rounded-lg"
                onPress={handleCallCustomer}
              >
                <Ionicons name="call" size={20} color={COLORS.success} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Book Now Badge */}
        {booking.is_book_now && (
          <View className="mx-4 mt-4">
            <BookNowBadge />
          </View>
        )}

        {/* Booking Path Badge */}
        {booking.booking_path && (
          <View className="mx-4 mt-4">
            <View
              className={`px-4 py-2 rounded-xl flex-row items-center ${
                booking.booking_path === 'auto' ? 'bg-purple-50' : 'bg-blue-50'
              }`}
            >
              <Ionicons
                name={booking.booking_path === 'auto' ? 'flash' : 'person'}
                size={18}
                color={booking.booking_path === 'auto' ? '#7C3AED' : '#1D4ED8'}
              />
              <Text
                style={{
                  fontFamily: 'Poppins-Medium',
                  fontSize: 13,
                  color: booking.booking_path === 'auto' ? '#7C3AED' : '#1D4ED8',
                  marginLeft: 8,
                }}
              >
                {booking.booking_path === 'auto' ? 'Auto-Selected' : 'Manually Selected'}
              </Text>
            </View>
          </View>
        )}

        {/* Timeout Countdown for Limbo States */}
        {booking.limbo_timeout_at && ['waiting_approval', 'waiting_quote', 'waiting_acceptance'].includes(booking.status) && (
          <View className="mx-4 mt-4">
            <TimeoutCountdown
              timeoutAt={booking.limbo_timeout_at}
              label={
                booking.status === 'waiting_approval'
                  ? 'Time to Accept/Reject'
                  : booking.status === 'waiting_quote'
                  ? 'Time to Submit Quote'
                  : 'Customer Response Time'
              }
            />
          </View>
        )}

        {/* Service Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
          <Text
            className="text-sm text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            SERVICE
          </Text>
          <Text
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            {booking.service_name}
          </Text>
          {booking.category_name && (
            <Text
              className="text-sm text-gray-500 mt-1"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {booking.category_name}
            </Text>
          )}
        </View>

        {/* Service Questions & Answers */}
        {booking.answers && booking.answers.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
            <Text
              className="text-sm text-gray-500 mb-3"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              SERVICE DETAILS
            </Text>
            {booking.answers.map((answer, index) => (
              <View key={index} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
                <Text
                  className="text-gray-600 mb-1"
                  style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
                >
                  {answer.question_text}
                </Text>
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
                >
                  {answer.answer_text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* User Description */}
        {booking.user_description && (
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
            <Text
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              CUSTOMER DESCRIPTION
            </Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              {booking.user_description}
            </Text>
          </View>
        )}

        {/* Legacy user_note field (kept for backward compatibility) */}
        {booking.user_note && (
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
            <Text
              className="text-sm text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              CUSTOMER NOTE
            </Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              {booking.user_note}
            </Text>
          </View>
        )}

        {/* Location */}
        {booking.zone_name && (
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                LOCATION
              </Text>
              {booking.user_lat && ['paid', 'on_the_way', 'job_start_requested', 'job_started', 'job_complete_requested'].includes(booking.status) && (
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={handleOpenMaps}
                >
                  <Ionicons name="navigate" size={16} color={COLORS.primary} />
                  <Text
                    className="text-primary text-sm ml-1"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Open Maps
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-start">
              <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              <View className="flex-1 ml-2">
                <Text
                  className="text-base text-gray-900"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {booking.zone_name}
                  {booking.sub_zone_name && `, ${booking.sub_zone_name}`}
                </Text>
                {booking.address_line && (
                  <Text
                    className="text-sm text-gray-500 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {booking.address_line}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
          <Text
            className="text-sm text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            PAYMENT
          </Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-gray-600"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Quotation Amount
            </Text>
            <Text
              className="text-gray-900 font-semibold"
              style={{ fontFamily: 'Poppins-SemiBold' }}
            >
              {formatCurrency(booking.quotation_amount)}
            </Text>
          </View>
          {booking.commission_amount && (
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-gray-600"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                Platform Fee ({booking.commission_percentage}%)
              </Text>
              <Text
                className="text-red-500"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                -{formatCurrency(booking.commission_amount)}
              </Text>
            </View>
          )}
          {booking.pro_earnings && (
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
              <Text
                className="text-gray-900 font-semibold"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Your Earnings
              </Text>
              <Text
                className="text-green-600 font-bold text-lg"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {formatCurrency(booking.pro_earnings)}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
          <Text
            className="text-sm text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            TIMELINE
          </Text>
          {[
            { label: 'Created', time: booking.created_at },
            { label: 'Accepted', time: booking.accepted_at },
            { label: 'Paid', time: booking.paid_at },
            { label: 'Completed', time: booking.completed_at },
          ]
            .filter((item) => item.time)
            .map((item, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text
                  className="text-sm text-gray-700 ml-2 flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {item.label}
                </Text>
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {formatDateTime(item.time)}
                </Text>
              </View>
            ))}
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 mb-8">{renderActionButtons()}</View>

        {/* Chat Button */}
        {['waiting_acceptance', 'paid', 'on_the_way', 'job_start_requested', 'job_started', 'job_complete_requested'].includes(booking.status) && (
          <View className="mx-4 mb-8">
            <Button
              title="Chat with Customer"
              onPress={() => navigation.navigate('Chat', { bookingId, booking })}
              variant="secondary"
              icon={<Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Phase 2: Quote Form Modal */}
      <QuoteFormModal
        visible={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        onSubmit={handleSendQuote}
        serviceName={booking?.service_name}
        loading={actionLoading}
      />

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Reject Booking
              </Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-gray-600 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Please provide a reason for rejection:
            </Text>

            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6 min-h-24"
              style={{ fontFamily: 'Poppins-Regular', textAlignVertical: 'top' }}
              placeholder="Enter reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <Button
              title="Reject Assignment"
              onPress={handleRejectAssignment}
              disabled={!rejectReason}
              loading={actionLoading}
              variant="danger"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default BookingDetailsScreen;
