/**
 * Booking Service - Phase 2
 *
 * Complete API integration for provider booking management
 * Includes assignment handling, quotes, scope confirmation, and lifecycle management
 */

import apiService from './api';
import { API_ENDPOINTS } from '../constants/api';

class BookingService {
  /**
   * ============================================================================
   * PHASE 2: ASSIGNMENT MANAGEMENT
   * ============================================================================
   */

  /**
   * Accept a booking assignment
   * Provider accepts the booking request within the timeout period
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Updated booking with status 'waiting_quote'
   */
  async acceptAssignment(bookingId) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_ACCEPT_ASSIGNMENT(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error accepting assignment:', error);
      throw error;
    }
  }

  /**
   * Reject a booking assignment
   * Provider rejects the booking, which gets reassigned or cancelled
   *
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Response with reassignment status
   */
  async rejectAssignment(bookingId, reason) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_REJECT_ASSIGNMENT(bookingId),
        { reason }
      );
      return response;
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * PHASE 2: QUOTE MANAGEMENT
   * ============================================================================
   */

  /**
   * Send quote with duration
   * Provider sends price quote and estimated job duration
   *
   * @param {string} bookingId - Booking ID
   * @param {number} amount - Quote amount in XAF
   * @param {number} durationMinutes - Estimated job duration in minutes
   * @returns {Promise<Object>} Updated booking with quote details
   */
  async sendQuote(bookingId, amount, durationMinutes) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_QUOTE(bookingId),
        {
          amount,
          durationMinutes
        }
      );
      return response;
    } catch (error) {
      console.error('Error sending quote:', error);
      throw error;
    }
  }

  /**
   * Confirm scope before quoting (Phase 2)
   * Provider confirms they've reviewed customer requirements
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Response confirming scope confirmation
   */
  async confirmScope(bookingId) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.BOOKING_CONFIRM_SCOPE(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error confirming scope:', error);
      throw error;
    }
  }

  /**
   * Get booking service question answers
   * Fetch customer's answers to service-specific questions
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} Array of answers with question details
   */
  async getBookingAnswers(bookingId) {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.BOOKING_ANSWERS(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error fetching booking answers:', error);
      throw error;
    }
  }

  /**
   * Get duration options for quotes
   * Fetch available duration options for job estimates
   *
   * @returns {Promise<Array>} Array of duration options in minutes
   */
  async getDurationOptions() {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.BOOKING_DURATION_OPTIONS
      );
      return response;
    } catch (error) {
      console.error('Error fetching duration options:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * BOOKING RETRIEVAL & DETAILS
   * ============================================================================
   */

  /**
   * Get all bookings for the provider
   *
   * @param {Object} params - Query parameters (page, limit, status, etc.)
   * @returns {Promise<Object>} Paginated booking list
   */
  async getBookings(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams
        ? `${API_ENDPOINTS.BOOKINGS}?${queryParams}`
        : API_ENDPOINTS.BOOKINGS;

      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  /**
   * Get booking details by ID
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Complete booking details
   */
  async getBookingById(bookingId) {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.BOOKING_DETAILS(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  }

  /**
   * Get booking history/timeline
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} Booking status change history
   */
  async getBookingHistory(bookingId) {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.BOOKING_HISTORY(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error fetching booking history:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * JOB LIFECYCLE MANAGEMENT
   * ============================================================================
   */

  /**
   * Mark provider as on the way
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Updated booking
   */
  async markOnTheWay(bookingId) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_ON_THE_WAY(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error marking on the way:', error);
      throw error;
    }
  }

  /**
   * Request job start
   * Provider requests to start the job (requires customer confirmation)
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Updated booking
   */
  async requestJobStart(bookingId) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_START(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error requesting job start:', error);
      throw error;
    }
  }

  /**
   * Request job completion
   * Provider marks job as complete (requires customer confirmation)
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Updated booking
   */
  async requestJobComplete(bookingId) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_COMPLETE(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error requesting job completion:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   *
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @param {string} cancelledBy - Who cancelled ('pro' or 'user')
   * @returns {Promise<Object>} Updated booking
   */
  async cancelBooking(bookingId, reason, cancelledBy = 'pro') {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.BOOKING_CANCEL(bookingId),
        { reason, cancelled_by: cancelledBy }
      );
      return response;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * MESSAGING
   * ============================================================================
   */

  /**
   * Get booking messages
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} Array of messages
   */
  async getMessages(bookingId) {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.BOOKING_MESSAGES(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send text message
   *
   * @param {string} bookingId - Booking ID
   * @param {string} message - Message text
   * @returns {Promise<Object>} Sent message
   */
  async sendMessage(bookingId, message) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.BOOKING_MESSAGES(bookingId),
        { message }
      );
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Send image message
   *
   * @param {string} bookingId - Booking ID
   * @param {FormData} formData - Form data with image
   * @returns {Promise<Object>} Sent message
   */
  async sendImageMessage(bookingId, formData) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.BOOKING_MESSAGES_IMAGE(bookingId),
        formData
      );
      return response;
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   *
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>} Response
   */
  async markMessagesAsRead(bookingId) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.BOOKING_MESSAGES_READ(bookingId)
      );
      return response;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  /**
   * Get appropriate action based on booking status
   *
   * @param {Object} booking - Booking object
   * @returns {string|null} Action type or null
   */
  getRequiredAction(booking) {
    const status = booking?.status;

    switch (status) {
      case 'waiting_approval':
        return 'ACCEPT_OR_REJECT_ASSIGNMENT';
      case 'waiting_quote':
        return 'SEND_QUOTE';
      case 'waiting_acceptance':
        return 'WAIT_FOR_CUSTOMER';
      case 'paid':
        return 'GO_TO_LOCATION';
      case 'on_the_way':
        return 'REQUEST_START';
      case 'job_start_requested':
        return 'WAIT_FOR_START_CONFIRMATION';
      case 'job_started':
        return 'REQUEST_COMPLETE';
      case 'job_complete_requested':
        return 'WAIT_FOR_COMPLETION_CONFIRMATION';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
      case 'rejected':
        return null;
      default:
        return null;
    }
  }

  /**
   * Check if booking has timed out
   *
   * @param {Object} booking - Booking object
   * @returns {boolean} True if timeout expired
   */
  hasTimedOut(booking) {
    if (!booking?.limbo_timeout_at) {
      return false;
    }

    const timeoutDate = new Date(booking.limbo_timeout_at);
    const now = new Date();
    return now > timeoutDate;
  }

  /**
   * Get remaining time in milliseconds
   *
   * @param {Object} booking - Booking object
   * @returns {number} Milliseconds remaining (0 if expired)
   */
  getRemainingTime(booking) {
    if (!booking?.limbo_timeout_at) {
      return 0;
    }

    const timeoutDate = new Date(booking.limbo_timeout_at);
    const now = new Date();
    const remaining = timeoutDate - now;

    return Math.max(0, remaining);
  }

  /**
   * Format time remaining as string
   *
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} Formatted time (e.g., "14:32" or "2 min")
   */
  formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) {
      return 'Expired';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export default new BookingService();
