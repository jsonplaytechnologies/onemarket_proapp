import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import apiService, { ApiError } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import {
  StatusBadge,
  TimeoutCountdown,
  BookNowBadge,
  CustomerAnswersCard,
  QuoteFormModal,
  getActionComponent,
} from '../../components/bookings';
import Button from '../../components/common/Button';
import { useBookingSocket } from '../../hooks/useSocket';
import { handleApiError } from '../../utils/errorHandler';

// StarRating component has been moved to ActionButtons/CompletedActions.js

const BookingDetailsScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [answers, setAnswers] = useState([]);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Refs to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  const { bookingStatus } = useBookingSocket(bookingId);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch on mount and when screen regains focus (but only if stale)
  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchBookingDetails();
      }
      return () => {};
    }, [bookingId])
  );

  // Handle socket status updates
  useEffect(() => {
    if (bookingStatus) {
      setBooking((prev) => (prev ? { ...prev, ...bookingStatus } : prev));
    }
  }, [bookingStatus]);

  const fetchBookingDetails = async (force = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) return;

    try {
      isFetchingRef.current = true;
      const response = await apiService.get(API_ENDPOINTS.BOOKING_DETAILS(bookingId));

      if (!isMountedRef.current) return;

      if (response.success) {
        setBooking(response.data);
        // Reset timeout state if booking status changed to a terminal state
        if (['expired', 'failed', 'cancelled', 'rejected'].includes(response.data?.status)) {
          setIsTimedOut(true);
        } else if (!['waiting_approval', 'waiting_quote', 'waiting_acceptance'].includes(response.data?.status)) {
          // If not in limbo state anymore, clear the timeout flag
          setIsTimedOut(false);
        }
        // Fetch answers for Phase 2 bookings (only if not already loaded)
        if (['waiting_approval', 'waiting_quote', 'waiting_acceptance'].includes(response.data?.status) && answers.length === 0) {
          fetchBookingAnswers();
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      if (isMountedRef.current) {
        Alert.alert(t('common.error'), t('common.failedToLoad'));
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
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
      const response = await apiService.patch(API_ENDPOINTS.BOOKING_ACCEPT_ASSIGNMENT(bookingId));
      Alert.alert(t('common.success'), t('bookings.actions.assignmentAccepted'));
      // Update booking locally - socket will also update but this provides instant feedback
      if (response.data?.booking) {
        setBooking((prev) => ({ ...prev, ...response.data.booking }));
      } else {
        setBooking((prev) => ({ ...prev, status: 'waiting_quote' }));
      }
    } catch (error) {
      handleApiError(error, 'Failed to accept assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Phase 2: Reject Assignment
  const handleRejectAssignment = async () => {
    if (!rejectReason) {
      Alert.alert(t('common.error'), t('bookings.actions.provideReason'));
      return;
    }

    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_REJECT_ASSIGNMENT(bookingId), {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      Alert.alert(t('bookings.actions.rejectBooking'), t('bookings.actions.assignmentRejected'));
      navigation.goBack();
    } catch (error) {
      handleApiError(error, 'Failed to reject assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle timeout expiration
  const handleTimeout = () => {
    setIsTimedOut(true);
    // Refresh booking details to get the updated status from backend
    fetchBookingDetails();
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
      Alert.alert(t('common.success'), t('bookings.actions.quoteSent'));
      // Update locally - socket will broadcast status change
      setBooking((prev) => ({
        ...prev,
        status: 'waiting_acceptance',
        quotation_amount: amount,
        quoted_duration_minutes: durationMinutes,
      }));
    } catch (error) {
      handleApiError(error, 'Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOnTheWay = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_ON_THE_WAY(bookingId));
      Alert.alert(t('common.success'), t('bookings.actions.customerNotified'));
      // Update locally - socket will broadcast status change
      setBooking((prev) => ({ ...prev, status: 'on_the_way' }));
    } catch (error) {
      handleApiError(error, 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestStart = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_START(bookingId));
      Alert.alert(t('common.success'), t('bookings.actions.startRequested'));
      // Update locally - socket will broadcast status change
      setBooking((prev) => ({ ...prev, status: 'job_start_requested' }));
    } catch (error) {
      handleApiError(error, 'Failed to request job start');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestComplete = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_COMPLETE(bookingId));
      Alert.alert(t('common.success'), t('bookings.actions.completionRequested'));
      // Update locally - socket will broadcast status change
      setBooking((prev) => ({ ...prev, status: 'job_complete_requested' }));
    } catch (error) {
      handleApiError(error, 'Failed to request completion');
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

  // Format scheduled datetime with relative dates
  const formatScheduledDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (dateOnly.getTime() === today.getTime()) {
      return `${t('schedule.today')} at ${time}`;
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return `${t('schedule.tomorrow')} at ${time}`;
    } else {
      return `${date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })} at ${time}`;
    }
  };

  /**
   * Render action buttons using component map pattern
   * Each status has its own dedicated component in ActionButtons/
   */
  const renderActionButtons = () => {
    const status = booking?.status;
    const ActionComponent = getActionComponent(status);

    if (!ActionComponent) return null;

    // Props mapping for each component type
    const componentProps = {
      booking,
      bookingId,
      answers,
      isTimedOut,
      actionLoading,
      navigation,
      // Action handlers
      onAccept: handleAcceptAssignment,
      onReject: () => setShowRejectModal(true),
      onSendQuote: () => setShowQuotationModal(true),
      onPress: {
        paid: handleOnTheWay,
        on_the_way: handleRequestStart,
        job_started: handleRequestComplete,
      }[status],
    };

    return <ActionComponent {...componentProps} />;
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
        <Text className="text-gray-500">{t('bookings.details.bookingNotFound')}</Text>
      </View>
    );
  }

  const userName = booking.user_first_name
    ? `${booking.user_first_name} ${booking.user_last_name || ''}`
    : 'Customer';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                {t('bookings.details.title')}
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
            {t('bookings.details.customer')}
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
                {booking.booking_path === 'auto' ? t('bookings.details.autoSelected') : t('bookings.details.manuallySelected')}
              </Text>
            </View>
          </View>
        )}

        {/* Scheduled Time - Prominent display */}
        {(booking.requested_datetime || booking.is_book_now) && (
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${booking.is_book_now ? 'bg-red-100' : 'bg-blue-100'}`}>
                <Ionicons
                  name={booking.is_book_now ? 'flash' : 'calendar'}
                  size={24}
                  color={booking.is_book_now ? '#EF4444' : COLORS.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {booking.is_book_now ? t('bookings.details.immediateRequest') : t('bookings.details.scheduledFor')}
                </Text>
                <Text
                  className={booking.is_book_now ? 'text-red-600' : 'text-gray-900'}
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18 }}
                >
                  {booking.is_book_now ? t('bookings.details.asap') : formatScheduledDateTime(booking.requested_datetime)}
                </Text>
              </View>
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
                  ? t('bookings.details.timeToAccept')
                  : booking.status === 'waiting_quote'
                  ? t('bookings.details.timeToSubmitQuote')
                  : t('bookings.details.customerResponseTime')
              }
              onTimeout={handleTimeout}
            />
          </View>
        )}

        {/* Service Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200">
          <Text
            className="text-sm text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {t('bookings.details.service')}
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
              {t('bookings.details.serviceDetails')}
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
              {t('bookings.details.customerDescription')}
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
              {t('bookings.details.customerNote')}
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
                {t('bookings.details.location')}
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
                    {t('bookings.details.openMaps')}
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
            {t('bookings.details.payment')}
          </Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text
              className="text-gray-600"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {t('bookings.details.quotationAmount')}
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
                {t('bookings.details.platformFee', { percent: booking.commission_percentage })}
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
                {t('bookings.details.yourEarnings')}
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
            {t('bookings.details.timeline')}
          </Text>
          {[
            { label: t('bookings.details.created'), time: booking.created_at },
            { label: t('bookings.details.accepted'), time: booking.accepted_at },
            { label: t('bookings.details.paid'), time: booking.paid_at },
            { label: t('bookings.details.completed'), time: booking.completed_at },
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
              title={t('bookings.details.chatWithCustomer')}
              onPress={() => navigation.navigate('Chat', { bookingId, booking })}
              variant="secondary"
              icon={<Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />}
            />
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

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
          behavior="padding"
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                {t('bookings.actions.rejectBooking')}
              </Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-gray-600 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {t('bookings.actions.rejectReason')}
            </Text>

            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6 min-h-24"
              style={{ fontFamily: 'Poppins-Regular', textAlignVertical: 'top' }}
              placeholder={t('bookings.actions.enterReason')}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <Button
              title={t('bookings.actions.rejectAssignment')}
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
