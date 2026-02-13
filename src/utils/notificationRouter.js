/**
 * Notification Router for Pro App
 * Maps notification type + data to navigation target (screen + params)
 * Used by: push notification handlers, toast tap, notification list tap
 */

/**
 * Get the navigation target for a notification
 * @param {object} data - Notification data (from push payload, toast, or notification list item)
 * @returns {{ screen: string, params?: object } | null} Navigation target or null
 */
export function getNavigationTarget(data) {
  if (!data) return null;

  // Normalize IDs - support both camelCase (push/socket) and snake_case (API/DB)
  const bookingId = data.bookingId || data.booking_id;
  const type = data.type;

  // Message notifications → Chat screen directly
  if (type === 'new_message' || type === 'message') {
    if (bookingId) {
      return { screen: 'Chat', params: { bookingId } };
    }
    return { screen: 'Chats' };
  }

  // Review notifications → Reviews screen
  if (type === 'review' || type === 'new_review' || type === 'review_response' || type === 'new_business_review') {
    return { screen: 'Reviews' };
  }

  // Withdrawal notifications → Withdrawals screen
  if (type === 'withdrawal' || type === 'withdrawal_completed' || type === 'withdrawal_failed' || type === 'withdrawal_approved') {
    return { screen: 'Withdrawals' };
  }

  // Referral notifications → Referrals screen
  if (type === 'referral_reward' || type === 'referral_expired') {
    return { screen: 'Referrals' };
  }

  // Tier notifications → Tier screen
  if (type === 'tier_upgraded' || type === 'tier_downgraded') {
    return { screen: 'Tier' };
  }

  // Points/earnings notifications → Earnings screen
  if (type === 'points_expiring' || type === 'signup_incentive_expired') {
    return { screen: 'Earnings' };
  }

  // All booking-related notifications → BookingDetails
  // Covers: booking_request, booking_accepted, booking_rejected, quotation_received,
  // quote_expired, assignment_timeout, quote_timeout, payment_received, payment_confirmed,
  // pro_on_the_way, job_start_request, job_started, job_start_confirmed,
  // job_complete_request, job_completed, job_complete_confirmed, booking_cancelled,
  // upcoming_job_reminder, scheduled_booking_warning, etc.
  if (bookingId) {
    return { screen: 'BookingDetails', params: { bookingId } };
  }

  // Fallback: go to notifications list
  return { screen: 'Notifications' };
}

/**
 * Navigate to the appropriate screen for a notification
 * @param {Function} navigateFn - Navigation function
 * @param {object} data - Notification data
 * @returns {boolean} Whether navigation was performed
 */
export function navigateToNotification(navigateFn, data) {
  const target = getNavigationTarget(data);
  if (target && navigateFn) {
    navigateFn(target.screen, target.params);
    return true;
  }
  return false;
}
