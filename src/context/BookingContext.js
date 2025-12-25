/**
 * Booking Context - Phase 2
 * Centralized booking state management for Provider App
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { useSocketContext } from './SocketContext';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { on, off, isConnected } = useSocketContext();

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(API_ENDPOINTS.BOOKINGS);
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
  }, [fetchBookings]);

  // Accept assignment (Phase 2)
  const acceptAssignment = useCallback(async (bookingId) => {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_ACCEPT_ASSIGNMENT(bookingId)
      );

      if (response.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, ...response.data, status: 'waiting_quote' }
              : booking
          )
        );
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error accepting assignment:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Reject assignment (Phase 2)
  const rejectAssignment = useCallback(async (bookingId, reason) => {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_REJECT_ASSIGNMENT(bookingId),
        { reason }
      );

      if (response.success) {
        // Remove from local state
        setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error rejecting assignment:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Send quote with duration (Phase 2)
  const sendQuote = useCallback(async (bookingId, amount, durationMinutes) => {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_QUOTE(bookingId),
        { amount, durationMinutes }
      );

      if (response.success) {
        // Update local state
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  ...response.data,
                  status: 'waiting_acceptance',
                  quotation_amount: amount,
                  quoted_duration_minutes: durationMinutes,
                }
              : booking
          )
        );
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error sending quote:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Get booking answers (Phase 2)
  const getBookingAnswers = useCallback(async (bookingId) => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_ANSWERS(bookingId));

      if (response.success) {
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error fetching booking answers:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update booking status - on the way
  const markOnTheWay = useCallback(async (bookingId) => {
    try {
      const response = await apiService.patch(API_ENDPOINTS.BOOKING_ON_THE_WAY(bookingId));

      if (response.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'on_the_way' }
              : booking
          )
        );
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error marking on the way:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Request job start
  const requestJobStart = useCallback(async (bookingId) => {
    try {
      const response = await apiService.patch(API_ENDPOINTS.BOOKING_START(bookingId));

      if (response.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'job_start_requested' }
              : booking
          )
        );
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error requesting job start:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Request job completion
  const requestJobComplete = useCallback(async (bookingId) => {
    try {
      const response = await apiService.patch(API_ENDPOINTS.BOOKING_COMPLETE(bookingId));

      if (response.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: 'job_complete_requested' }
              : booking
          )
        );
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error requesting job completion:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update booking in local state
  const updateBooking = useCallback((bookingId, updates) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, ...updates } : booking
      )
    );
  }, []);

  // Get single booking by ID
  const getBooking = useCallback((bookingId) => {
    return bookings.find((booking) => booking.id === bookingId);
  }, [bookings]);

  // Filter bookings by status
  const getBookingsByStatus = useCallback((statuses) => {
    return bookings.filter((booking) => statuses.includes(booking.status));
  }, [bookings]);

  // Socket event handlers for real-time booking list updates
  // NOTE: These handlers update BOOKING STATE only. Toast notifications are
  // handled by NotificationContext. useBookingSocket handles per-booking state.
  // This avoids duplicate event handlers across contexts.

  // Define handlers with useCallback for stable references
  const handleNewAssignment = useCallback((data) => {
    console.log('[BookingContext] New assignment received:', data);
    // Refresh bookings to get the new assignment
    fetchBookings();
  }, [fetchBookings]);

  const handleAssignmentTimeoutWarning = useCallback((data) => {
    console.log('[BookingContext] Assignment timeout warning:', data);
    updateBooking(data.bookingId, { timeoutWarning: true, secondsRemaining: data.secondsRemaining });
  }, [updateBooking]);

  const handleQuoteTimeoutWarning = useCallback((data) => {
    console.log('[BookingContext] Quote timeout warning:', data);
    updateBooking(data.bookingId, { timeoutWarning: true, secondsRemaining: data.secondsRemaining });
  }, [updateBooking]);

  const handleQuoteAccepted = useCallback((data) => {
    console.log('[BookingContext] Quote accepted:', data);
    updateBooking(data.bookingId, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  }, [updateBooking]);

  const handleQuoteDeclined = useCallback((data) => {
    console.log('[BookingContext] Quote declined:', data);
    // Remove booking from list
    setBookings((prev) => prev.filter((b) => b.id !== data.bookingId));
  }, []);

  const handleStatusChanged = useCallback((data) => {
    console.log('[BookingContext] Booking status changed:', data);
    updateBooking(data.bookingId, { status: data.status });
  }, [updateBooking]);

  const handleJobConflictWarning = useCallback((data) => {
    console.log('[BookingContext] Job conflict warning:', data);
    // Update booking with conflict info (notification toast handled by NotificationContext)
    if (data.currentBookingId) {
      updateBooking(data.currentBookingId, { hasConflict: true, conflictData: data });
    }
  }, [updateBooking]);

  const handleNextJobCancelled = useCallback((data) => {
    console.log('[BookingContext] Next job cancelled:', data);
    setBookings((prev) => prev.filter((b) => b.id !== data.cancelledBookingId));
  }, []);

  const handlePaymentConfirmed = useCallback((data) => {
    console.log('[BookingContext] Payment confirmed:', data);
    updateBooking(data.bookingId, { status: 'paid', paid_at: new Date().toISOString() });
  }, [updateBooking]);

  const handleJobStartApproved = useCallback((data) => {
    console.log('[BookingContext] Job start approved:', data);
    updateBooking(data.bookingId, { status: 'job_started', job_started_at: new Date().toISOString() });
  }, [updateBooking]);

  const handleJobCompleteApproved = useCallback((data) => {
    console.log('[BookingContext] Job complete approved:', data);
    updateBooking(data.bookingId, { status: 'completed', completed_at: new Date().toISOString() });
  }, [updateBooking]);

  useEffect(() => {
    if (!isConnected) return;

    // Register socket event listeners with specific callbacks
    on('new-assignment', handleNewAssignment);
    on('assignment-timeout-warning', handleAssignmentTimeoutWarning);
    on('quote-timeout-warning', handleQuoteTimeoutWarning);
    on('quote-accepted', handleQuoteAccepted);
    on('quote-declined', handleQuoteDeclined);
    on('booking-status-changed', handleStatusChanged);
    on('job-conflict-warning', handleJobConflictWarning);
    on('next-job-cancelled', handleNextJobCancelled);
    on('payment-confirmed', handlePaymentConfirmed);
    on('job-start-approved', handleJobStartApproved);
    on('job-complete-approved', handleJobCompleteApproved);

    // Cleanup with specific callback references
    return () => {
      off('new-assignment', handleNewAssignment);
      off('assignment-timeout-warning', handleAssignmentTimeoutWarning);
      off('quote-timeout-warning', handleQuoteTimeoutWarning);
      off('quote-accepted', handleQuoteAccepted);
      off('quote-declined', handleQuoteDeclined);
      off('booking-status-changed', handleStatusChanged);
      off('job-conflict-warning', handleJobConflictWarning);
      off('next-job-cancelled', handleNextJobCancelled);
      off('payment-confirmed', handlePaymentConfirmed);
      off('job-start-approved', handleJobStartApproved);
      off('job-complete-approved', handleJobCompleteApproved);
    };
  }, [
    isConnected,
    on,
    off,
    handleNewAssignment,
    handleAssignmentTimeoutWarning,
    handleQuoteTimeoutWarning,
    handleQuoteAccepted,
    handleQuoteDeclined,
    handleStatusChanged,
    handleJobConflictWarning,
    handleNextJobCancelled,
    handlePaymentConfirmed,
    handleJobStartApproved,
    handleJobCompleteApproved,
  ]);

  const value = {
    // State
    bookings,
    loading,
    error,
    refreshing,

    // Actions - Assignment & Quote
    acceptAssignment,
    rejectAssignment,
    sendQuote,
    getBookingAnswers,

    // Actions - Job flow
    markOnTheWay,
    requestJobStart,
    requestJobComplete,

    // Utility
    fetchBookings,
    refreshBookings,
    updateBooking,
    getBooking,
    getBookingsByStatus,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
