/**
 * Shared Error Handler Utility
 * SINGLE SOURCE OF TRUTH for API error handling in the app
 *
 * Usage:
 * import { handleApiError } from '../utils/errorHandler';
 *
 * try {
 *   await apiService.patch(...);
 * } catch (error) {
 *   handleApiError(error, 'Failed to perform action');
 * }
 */

import { Alert } from 'react-native';

/**
 * Handle API errors with consistent user-facing messages
 *
 * @param {Error} error - The error object from API call
 * @param {string} defaultMessage - Default message if no specific error handling applies
 * @param {Object} options - Additional options
 * @param {Function} options.onRateLimited - Custom handler for rate limited errors
 * @param {Function} options.onValidationError - Custom handler for validation errors
 * @param {Function} options.onError - Custom handler for generic errors
 * @param {boolean} options.silent - If true, don't show any alerts
 * @returns {Object} - { handled: boolean, error: Error }
 */
export const handleApiError = (error, defaultMessage = 'An error occurred', options = {}) => {
  const {
    onRateLimited,
    onValidationError,
    onError,
    silent = false,
  } = options;

  // Rate limited
  if (error.code === 'RATE_LIMITED') {
    const message = `Too many requests. Try again in ${error.retryAfter || 30} seconds.`;
    if (onRateLimited) {
      onRateLimited(error, message);
    } else if (!silent) {
      Alert.alert('Please Wait', message);
    }
    return { handled: true, error, type: 'RATE_LIMITED' };
  }

  // Validation error
  if (error.code === 'VALIDATION_ERROR') {
    const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
    if (onValidationError) {
      onValidationError(error, errorMsg);
    } else if (!silent) {
      Alert.alert('Validation Error', errorMsg);
    }
    return { handled: true, error, type: 'VALIDATION_ERROR' };
  }

  // Network error
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
    const message = 'Network error. Please check your connection and try again.';
    if (onError) {
      onError(error, message);
    } else if (!silent) {
      Alert.alert('Connection Error', message);
    }
    return { handled: true, error, type: 'NETWORK_ERROR' };
  }

  // Unauthorized
  if (error.code === 'UNAUTHORIZED' || error.status === 401) {
    const message = 'Session expired. Please log in again.';
    if (onError) {
      onError(error, message);
    } else if (!silent) {
      Alert.alert('Session Expired', message);
    }
    return { handled: true, error, type: 'UNAUTHORIZED' };
  }

  // Generic error
  const message = error.message || defaultMessage;
  if (onError) {
    onError(error, message);
  } else if (!silent) {
    Alert.alert('Error', message);
  }
  return { handled: true, error, type: 'GENERIC' };
};

/**
 * Create an error handler with pre-configured options
 * Useful for screens that need consistent error handling
 *
 * @param {Object} defaultOptions - Default options for all error handling
 * @returns {Function} - Configured error handler
 *
 * Usage:
 * const showError = createErrorHandler({ silent: false });
 * try { ... } catch (error) { showError(error, 'Failed to save'); }
 */
export const createErrorHandler = (defaultOptions = {}) => {
  return (error, defaultMessage, overrideOptions = {}) => {
    return handleApiError(error, defaultMessage, { ...defaultOptions, ...overrideOptions });
  };
};

/**
 * Wrap an async function with error handling
 *
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} errorMessage - Default error message
 * @param {Object} options - Error handler options
 * @returns {Function} - Wrapped function that handles errors
 *
 * Usage:
 * const safeAccept = withErrorHandling(
 *   async () => await apiService.patch(...),
 *   'Failed to accept assignment'
 * );
 * await safeAccept();
 */
export const withErrorHandling = (asyncFn, errorMessage, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleApiError(error, errorMessage, options);
      throw error;
    }
  };
};

export default handleApiError;
