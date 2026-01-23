/**
 * Push Token Service
 * Handles push token registration and removal with the backend
 */

import api from './api';

const PUSH_TOKEN_ENDPOINT = '/api/push-tokens';

/**
 * Register push token with backend
 * @param {string} token - Expo push token
 * @param {string} deviceType - 'android' or 'ios'
 * @param {string} deviceName - Device model name
 * @returns {Promise<Object>} Registration result
 */
export const registerPushToken = async (token, deviceType, deviceName) => {
  try {
    const response = await api.post(PUSH_TOKEN_ENDPOINT, {
      token,
      deviceType,
      deviceName,
      appType: 'pro', // This is the pro app
    });
    return response;
  } catch (error) {
    console.error('Failed to register push token:', error);
    throw error;
  }
};

/**
 * Remove push token from backend (on logout)
 * @param {string} token - Expo push token to remove
 * @returns {Promise<Object>} Removal result
 */
export const removePushToken = async (token) => {
  try {
    const response = await api.delete(PUSH_TOKEN_ENDPOINT, {
      body: JSON.stringify({ token }),
    });
    return response;
  } catch (error) {
    console.error('Failed to remove push token:', error);
    // Don't throw - token removal failure shouldn't block logout
  }
};

/**
 * Get user's registered devices
 * @returns {Promise<Array>} List of registered devices
 */
export const getRegisteredDevices = async () => {
  try {
    const response = await api.get(`${PUSH_TOKEN_ENDPOINT}/devices`);
    return response.data?.devices || [];
  } catch (error) {
    console.error('Failed to get registered devices:', error);
    return [];
  }
};

export default {
  registerPushToken,
  removePushToken,
  getRegisteredDevices,
};
