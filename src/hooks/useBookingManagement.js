/**
 * useBookingManagement Hook
 * Business logic for booking management (Phase 2)
 */

import { useState, useCallback } from 'react';
import apiService from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export const useBookingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Accept assignment (Phase 2)
  const acceptAssignment = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_ACCEPT_ASSIGNMENT(bookingId)
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Assignment accepted! Discuss scope with customer.',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to accept assignment');
      return {
        success: false,
        error: err.message || 'Failed to accept assignment',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reject assignment (Phase 2)
  const rejectAssignment = useCallback(async (bookingId, reason) => {
    if (!reason) {
      setError('Please provide a reason for rejection');
      return { success: false, error: 'Reason is required' };
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_REJECT_ASSIGNMENT(bookingId),
        { reason }
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Assignment rejected',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to reject assignment');
      return {
        success: false,
        error: err.message || 'Failed to reject assignment',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Send quote with duration (Phase 2)
  const sendQuote = useCallback(async (bookingId, amount, durationMinutes) => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return { success: false, error: 'Invalid amount' };
    }

    if (!durationMinutes) {
      setError('Please select job duration');
      return { success: false, error: 'Duration is required' };
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_QUOTE(bookingId),
        {
          amount: parseInt(amount),
          durationMinutes: parseInt(durationMinutes),
        }
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Quote sent to customer',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to send quote');
      return {
        success: false,
        error: err.message || 'Failed to send quote',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get booking answers (Phase 2)
  const getBookingAnswers = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_ANSWERS(bookingId));

      if (response.success) {
        return {
          success: true,
          data: response.data || [],
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch booking answers');
      return {
        success: false,
        error: err.message || 'Failed to fetch booking answers',
        data: [],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Confirm scope (Phase 2)
  const confirmScope = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.post(
        API_ENDPOINTS.BOOKING_CONFIRM_SCOPE(bookingId)
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Scope confirmed',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm scope');
      return {
        success: false,
        error: err.message || 'Failed to confirm scope',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark on the way
  const markOnTheWay = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_ON_THE_WAY(bookingId)
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Customer notified that you are on the way',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
      return {
        success: false,
        error: err.message || 'Failed to update status',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Request job start
  const requestJobStart = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(API_ENDPOINTS.BOOKING_START(bookingId));

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Job start request sent. Waiting for customer confirmation.',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to request job start');
      return {
        success: false,
        error: err.message || 'Failed to request job start',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Request job completion
  const requestJobComplete = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_COMPLETE(bookingId)
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Completion request sent. Waiting for customer confirmation.',
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to request completion');
      return {
        success: false,
        error: err.message || 'Failed to request completion',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get booking details
  const getBookingDetails = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_DETAILS(bookingId));

      if (response.success) {
        return {
          success: true,
          data: response.data,
        };
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch booking details');
      return {
        success: false,
        error: err.message || 'Failed to fetch booking details',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,

    // Phase 2 Actions
    acceptAssignment,
    rejectAssignment,
    sendQuote,
    getBookingAnswers,
    confirmScope,

    // Job Flow Actions
    markOnTheWay,
    requestJobStart,
    requestJobComplete,

    // Utility
    getBookingDetails,
  };
};

export default useBookingManagement;
