/**
 * Navigation Service
 * Provides navigation capabilities outside of React components
 * Uses a ref that's set by AppNavigator
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen
 * @param {string} name - Screen name
 * @param {object} params - Navigation params
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('Navigation not ready, cannot navigate to:', name);
  }
}

/**
 * Check if navigation is ready
 * @returns {boolean}
 */
export function isReady() {
  return navigationRef.isReady();
}
