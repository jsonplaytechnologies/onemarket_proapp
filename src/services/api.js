import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

// Custom error class for API errors with additional metadata
export class ApiError extends Error {
  constructor(message, status, code, errors = null, retryAfter = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors; // Field-level validation errors
    this.retryAfter = retryAfter; // Seconds until rate limit resets
  }
}

// Callback for handling auth expiry (set by AuthContext)
let onAuthExpired = null;
let onAccountDeactivated = null;

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Set callback for auth expiry handling
  setOnAuthExpired(callback) {
    onAuthExpired = callback;
  }

  // Set callback for account deactivation handling
  setOnAccountDeactivated(callback) {
    onAccountDeactivated = callback;
  }

  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      return refreshToken;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  // Store both tokens
  async storeTokens(token, refreshToken) {
    try {
      await AsyncStorage.setItem('token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear all tokens
  async clearTokens() {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Refresh the access token
  async refreshAccessToken() {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
    }

    const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Failed to refresh token',
        response.status,
        'REFRESH_FAILED'
      );
    }

    // Store new tokens
    await this.storeTokens(data.data.token, data.data.refreshToken);

    return data.data.token;
  }

  async request(endpoint, options = {}, isRetry = false) {
    const token = await this.getAuthToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      console.log(`[API] ${config.method || 'GET'} ${endpoint} →`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      const data = await response.json();
      console.log(`[API] ${endpoint} ← ${response.status}${data.success === false ? ' ERR' : ''}`);

      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token first
        if (response.status === 401 && !isRetry) {
          // Don't try to refresh if this IS the refresh request
          if (endpoint.includes('/refresh-token')) {
            await this.clearTokens();
            if (onAuthExpired) {
              onAuthExpired();
            }
            throw new ApiError(
              'Session expired. Please login again.',
              401,
              'UNAUTHORIZED'
            );
          }

          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(async (newToken) => {
              // Retry with new token
              options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              };
              return this.request(endpoint, options, true);
            });
          }

          isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            processQueue(null, newToken);

            // Retry the original request with new token
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            };
            return this.request(endpoint, options, true);
          } catch (refreshError) {
            processQueue(refreshError, null);
            await this.clearTokens();
            if (onAuthExpired) {
              onAuthExpired();
            }
            throw new ApiError(
              'Session expired. Please login again.',
              401,
              'UNAUTHORIZED'
            );
          } finally {
            isRefreshing = false;
          }
        }

        // Handle 429 Rate Limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || 60;
          throw new ApiError(
            data.message || `Too many requests. Please wait ${retryAfter} seconds.`,
            429,
            'RATE_LIMITED',
            null,
            parseInt(retryAfter, 10)
          );
        }

        // Handle 422 Validation Errors
        if (response.status === 422) {
          const validationErrors = data.errors || [];
          const errorMessages = validationErrors.map(e => e.msg || e.message).join(', ');
          throw new ApiError(
            errorMessages || data.message || 'Validation failed',
            422,
            'VALIDATION_ERROR',
            validationErrors
          );
        }

        // Handle 403 Account Deactivated
        if (response.status === 403 && data.message && data.message.toLowerCase().includes('deactivated')) {
          await this.clearTokens();
          if (onAccountDeactivated) {
            onAccountDeactivated();
          }
          throw new ApiError(
            data.message,
            403,
            'ACCOUNT_DEACTIVATED'
          );
        }

        // Handle other errors
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data.code || 'UNKNOWN_ERROR'
        );
      }

      return data;
    } catch (error) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }
      // Wrap other errors
      console.error(`[API] ${endpoint} Error:`, error.message);
      throw new ApiError(
        error.message || 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export default new ApiService();
