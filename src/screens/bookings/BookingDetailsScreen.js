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
import { StatusBadge } from '../../components/bookings';
import Button from '../../components/common/Button';
import { useBookingSocket } from '../../hooks/useSocket';

const BookingDetailsScreen = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationAmount, setQuotationAmount] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_ACCEPT(bookingId));
      Alert.alert('Success', 'Booking accepted. You can now send a quotation.');
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
        Alert.alert('Error', error.message || 'Failed to accept booking');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_REJECT(bookingId), {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      Alert.alert('Booking Rejected', 'The booking has been rejected.');
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
        Alert.alert('Error', error.message || 'Failed to reject booking');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuotation = async () => {
    if (!quotationAmount || parseInt(quotationAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    try {
      await apiService.patch(API_ENDPOINTS.BOOKING_QUOTATION(bookingId), {
        amount: parseInt(quotationAmount),
      });
      setShowQuotationModal(false);
      Alert.alert('Success', 'Quotation sent to customer');
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
        Alert.alert('Error', error.message || 'Failed to send quotation');
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
      case 'pending':
        return (
          <View className="flex-row space-x-3">
            <View className="flex-1 mr-2">
              <Button
                title="Accept"
                onPress={handleAccept}
                loading={actionLoading}
                variant="success"
              />
            </View>
            <View className="flex-1">
              <Button
                title="Reject"
                onPress={() => setShowRejectModal(true)}
                variant="danger"
              />
            </View>
          </View>
        );

      case 'accepted':
        return (
          <Button
            title="Send Quotation"
            onPress={() => setShowQuotationModal(true)}
            icon={<Ionicons name="document-text-outline" size={20} color="#FFFFFF" />}
          />
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
              {booking.status === 'paid' ||
              booking.status === 'on_the_way' ||
              booking.status === 'job_started' ||
              booking.status === 'job_complete_requested' ||
              booking.status === 'completed' ? (
                <Text
                  className="text-sm text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {booking.user_phone}
                </Text>
              ) : null}
            </View>
            {booking.user_phone && ['paid', 'on_the_way', 'job_started'].includes(booking.status) && (
              <TouchableOpacity
                className="bg-green-100 p-2 rounded-lg"
                onPress={handleCallCustomer}
              >
                <Ionicons name="call" size={20} color={COLORS.success} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
          {booking.user_note && (
            <View className="mt-3 p-3 bg-gray-50 rounded-lg">
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                Customer Note:
              </Text>
              <Text
                className="text-sm text-gray-700 mt-1"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {booking.user_note}
              </Text>
            </View>
          )}
        </View>

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
              {booking.user_lat && ['paid', 'on_the_way', 'job_started'].includes(booking.status) && (
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
        {['accepted', 'quotation_sent', 'paid', 'on_the_way', 'job_started'].includes(booking.status) && (
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

      {/* Quotation Modal */}
      <Modal
        visible={showQuotationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuotationModal(false)}
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
                Send Quotation
              </Text>
              <TouchableOpacity onPress={() => setShowQuotationModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-gray-600 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Enter the total amount for this job:
            </Text>

            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-6">
              <TextInput
                className="flex-1 text-2xl font-semibold text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold' }}
                placeholder="0"
                value={quotationAmount}
                onChangeText={setQuotationAmount}
                keyboardType="number-pad"
              />
              <Text
                className="text-base text-gray-500 ml-2"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                XAF
              </Text>
            </View>

            <Button
              title="Send Quotation"
              onPress={handleSendQuotation}
              disabled={!quotationAmount}
              loading={actionLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
              title="Reject Booking"
              onPress={handleReject}
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
