import apiService from './api';
import { API_ENDPOINTS } from '../constants/api';
import cacheManager, { CACHE_KEYS, CACHE_TYPES } from '../utils/cacheManager';

/**
 * Incentive Service - Handles referrals, tiers, and signup bonuses
 */

// Get provider's referral code (generates if not exists)
export const getMyReferralCode = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.REFERRAL_CODE;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.INCENTIVE);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.REFERRAL_MY_CODE)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching referral code:', error);
    throw error;
  }
};

// Get referral statistics
export const getReferralStats = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.REFERRAL_STATS;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.INCENTIVE);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.REFERRAL_STATS)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    throw error;
  }
};

// Get paginated list of referrals
export const getMyReferrals = async (page = 1, limit = 20) => {
  try {
    const response = await apiService.get(
      `${API_ENDPOINTS.REFERRAL_LIST}?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching referrals list:', error);
    throw error;
  }
};

// Validate a referral code (public endpoint, used during signup)
export const validateReferralCode = async (code) => {
  try {
    const response = await apiService.post(API_ENDPOINTS.REFERRAL_VALIDATE, { code });
    return response;
  } catch (error) {
    console.error('Error validating referral code:', error);
    throw error;
  }
};

// Get current tier status and progress
export const getMyTier = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.TIER_STATUS;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.TIER);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.TIER_MY_TIER)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching tier status:', error);
    throw error;
  }
};

// Get all tier benefits (public/static data)
export const getTierBenefits = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.TIER_BENEFITS;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.TIER_BENEFITS);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.TIER_BENEFITS)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching tier benefits:', error);
    throw error;
  }
};

// Get tier change history
export const getTierHistory = async (page = 1, limit = 20) => {
  try {
    const response = await apiService.get(
      `${API_ENDPOINTS.TIER_HISTORY}?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching tier history:', error);
    throw error;
  }
};

// Get signup incentive status
export const getSignupStatus = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.SIGNUP_STATUS;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.INCENTIVE);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.INCENTIVE_SIGNUP_STATUS)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching signup status:', error);
    throw error;
  }
};

// Get combined incentive dashboard data
export const getIncentiveDashboard = async (forceRefresh = false) => {
  try {
    const cacheKey = CACHE_KEYS.INCENTIVE_DASHBOARD;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey, CACHE_TYPES.INCENTIVE);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    const response = await cacheManager.deduplicatedFetch(
      cacheKey,
      () => apiService.get(API_ENDPOINTS.INCENTIVE_DASHBOARD)
    );

    if (response.success) {
      cacheManager.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    console.error('Error fetching incentive dashboard:', error);
    throw error;
  }
};

// Invalidate all incentive-related cache
export const invalidateIncentiveCache = () => {
  cacheManager.invalidatePattern('referral');
  cacheManager.invalidatePattern('tier');
  cacheManager.invalidatePattern('signup');
  cacheManager.invalidatePattern('incentive');
};

// Provider tier configurations
export const PROVIDER_TIERS = {
  starter: {
    name: 'Starter',
    icon: 'leaf-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    bonusRate: 0,
    minJobs: 0,
    minRating: 0,
  },
  qualified: {
    name: 'Qualified',
    icon: 'medal-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    bonusRate: 0.02,
    minJobs: 10,
    minRating: 4.0,
  },
  experienced: {
    name: 'Experienced',
    icon: 'ribbon-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    bonusRate: 0.05,
    minJobs: 50,
    minRating: 4.5,
  },
  expert: {
    name: 'Expert',
    icon: 'trophy-outline',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    bonusRate: 0.10,
    minJobs: 200,
    minRating: 4.8,
  },
};

// Requester tier configurations
export const REQUESTER_TIERS = {
  bronze: {
    name: 'Bronze',
    icon: 'shield-outline',
    color: '#CD7F32',
    bgColor: '#FDF4E7',
    pointsPerJob: 5,
    pointsPerSpend: 1,
    minJobs: 0,
    minSpend: 0,
  },
  silver: {
    name: 'Silver',
    icon: 'shield-half-outline',
    color: '#C0C0C0',
    bgColor: '#F5F5F5',
    pointsPerJob: 10,
    pointsPerSpend: 2,
    minJobs: 5,
    minSpend: 100,
  },
  gold: {
    name: 'Gold',
    icon: 'shield',
    color: '#FFD700',
    bgColor: '#FFFBEB',
    pointsPerJob: 15,
    pointsPerSpend: 3,
    minJobs: 20,
    minSpend: 500,
  },
  platinum: {
    name: 'Platinum',
    icon: 'diamond-outline',
    color: '#E5E4E2',
    bgColor: '#F8F8FF',
    pointsPerJob: 25,
    pointsPerSpend: 5,
    minJobs: 50,
    minSpend: 2000,
  },
};

// Get tier display info based on tier key and optional user type
export const getTierInfo = (tierKey, userType = null) => {
  // Check provider tiers first
  if (PROVIDER_TIERS[tierKey]) {
    return PROVIDER_TIERS[tierKey];
  }
  // Check requester tiers
  if (REQUESTER_TIERS[tierKey]) {
    return REQUESTER_TIERS[tierKey];
  }
  // Fallback based on user type
  if (userType === 'requester') {
    return REQUESTER_TIERS.bronze;
  }
  return PROVIDER_TIERS.starter;
};

// Format bonus rate as percentage
export const formatBonusRate = (rate) => {
  return `${Math.round(rate * 100)}%`;
};

export default {
  getMyReferralCode,
  getReferralStats,
  getMyReferrals,
  validateReferralCode,
  getMyTier,
  getTierBenefits,
  getTierHistory,
  getSignupStatus,
  getIncentiveDashboard,
  invalidateIncentiveCache,
  getTierInfo,
  formatBonusRate,
  PROVIDER_TIERS,
  REQUESTER_TIERS,
};
