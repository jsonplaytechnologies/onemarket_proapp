/**
 * Status Action Buttons - Component Map
 *
 * Replaces the large switch statement in BookingDetailsScreen
 * Each status has its own focused component
 */

import WaitingApprovalActions from './WaitingApprovalActions';
import WaitingQuoteActions from './WaitingQuoteActions';
import WaitingAcceptanceActions from './WaitingAcceptanceActions';
import PaidActions from './PaidActions';
import OnTheWayActions from './OnTheWayActions';
import JobStartRequestedActions from './JobStartRequestedActions';
import JobStartedActions from './JobStartedActions';
import JobCompleteRequestedActions from './JobCompleteRequestedActions';
import CompletedActions from './CompletedActions';
import TimeoutMessage from './TimeoutMessage';

/**
 * Status to component mapping
 * Each status maps to a component that handles its UI
 */
export const STATUS_ACTION_COMPONENTS = {
  waiting_approval: WaitingApprovalActions,
  waiting_quote: WaitingQuoteActions,
  waiting_acceptance: WaitingAcceptanceActions,
  paid: PaidActions,
  on_the_way: OnTheWayActions,
  job_start_requested: JobStartRequestedActions,
  job_started: JobStartedActions,
  job_complete_requested: JobCompleteRequestedActions,
  completed: CompletedActions,
};

/**
 * Get the appropriate action component for a booking status
 *
 * @param {string} status - Booking status
 * @returns {Component|null} - React component or null
 */
export const getActionComponent = (status) => {
  return STATUS_ACTION_COMPONENTS[status] || null;
};

export {
  WaitingApprovalActions,
  WaitingQuoteActions,
  WaitingAcceptanceActions,
  PaidActions,
  OnTheWayActions,
  JobStartRequestedActions,
  JobStartedActions,
  JobCompleteRequestedActions,
  CompletedActions,
  TimeoutMessage,
};
