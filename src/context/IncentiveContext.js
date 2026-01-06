import React, { createContext, useState, useContext, useCallback } from 'react';
import { Share, Platform } from 'react-native';
import {
  getMyReferralCode,
  getReferralStats,
  getMyReferrals,
  getMyTier,
  getTierBenefits,
  getSignupStatus,
  getIncentiveDashboard,
  invalidateIncentiveCache,
  getTierInfo,
} from '../services/incentiveService';

export const IncentiveContext = createContext();

export const IncentiveProvider = ({ children }) => {
  // Referral state
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralList, setReferralList] = useState([]);
  const [referralPagination, setReferralPagination] = useState({ page: 1, hasMore: true });

  // Tier state
  const [tierStatus, setTierStatus] = useState(null);
  const [tierBenefits, setTierBenefits] = useState(null);

  // Signup bonus state
  const [signupBonus, setSignupBonus] = useState(null);

  // Combined dashboard state
  const [dashboard, setDashboard] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch combined incentive dashboard
  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard and referral code in parallel
      const [dashboardResponse, referralCodeResponse] = await Promise.all([
        getIncentiveDashboard(forceRefresh).catch(() => null),
        getMyReferralCode(forceRefresh).catch(() => null),
      ]);

      // Handle dashboard response
      if (dashboardResponse?.success) {
        // Backend returns { dashboard: {...} }
        const dashboardData = dashboardResponse.data?.dashboard || dashboardResponse.data;
        setDashboard(dashboardData);

        // Update tier status
        if (dashboardData?.tier) {
          // nextTier from dashboard is an object: { tier, benefits, progress: { jobs, rating } }
          const nextTierData = dashboardData.tier.nextTier;
          setTierStatus({
            tier: dashboardData.tier.current,
            currentTier: dashboardData.tier.current,
            nextTier: nextTierData?.tier,  // Extract tier name string
            progressPercentage: nextTierData?.overallProgress || dashboardData.tier.progressPercentage,
            bonusRate: dashboardData.tier.benefits?.bonusRate || 0,
            progressToNext: {
              jobs: nextTierData?.progress?.jobs,
              rating: nextTierData?.progress?.rating,
            },
          });
        }

        // Update referral stats
        if (dashboardData?.referrals) {
          setReferralStats({
            stats: dashboardData.referrals,
            ...dashboardData.referrals,
          });
        }

        // Update signup bonus
        if (dashboardData?.signupBonus) {
          setSignupBonus(dashboardData.signupBonus);
        }
      }

      // Handle referral code response
      if (referralCodeResponse?.success) {
        // Backend returns { referralCode: {...}, shareUrl: "..." }
        const codeData = referralCodeResponse.data?.referralCode || referralCodeResponse.data;
        const shareUrl = referralCodeResponse.data?.shareUrl;
        setReferralCode({
          ...codeData,
          shareUrl,
        });
      }

      return dashboardResponse;
    } catch (err) {
      setError(err.message || 'Failed to fetch incentive data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch referral code
  const fetchReferralCode = useCallback(async (forceRefresh = false) => {
    try {
      const response = await getMyReferralCode(forceRefresh);
      if (response.success) {
        // Backend returns { referralCode: {...}, shareUrl: "..." }
        const codeData = response.data?.referralCode || response.data;
        const shareUrl = response.data?.shareUrl;
        setReferralCode({
          ...codeData,
          shareUrl,
        });
      }
      return response;
    } catch (err) {
      console.error('Error fetching referral code:', err);
      throw err;
    }
  }, []);

  // Fetch referral stats
  const fetchReferralStats = useCallback(async (forceRefresh = false) => {
    try {
      const response = await getReferralStats(forceRefresh);
      if (response.success) {
        // Backend returns { stats: {...} }
        const statsData = response.data?.stats || response.data;
        setReferralStats({
          stats: statsData,
          ...statsData,
        });
      }
      return response;
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      throw err;
    }
  }, []);

  // Fetch referral list with pagination
  const fetchReferralList = useCallback(async (page = 1, reset = false) => {
    try {
      const response = await getMyReferrals(page);

      if (response.success) {
        const newReferrals = response.data.referrals || response.data || [];
        const pagination = response.data.pagination || {};

        if (reset || page === 1) {
          setReferralList(newReferrals);
        } else {
          setReferralList((prev) => [...prev, ...newReferrals]);
        }

        setReferralPagination({
          page,
          hasMore: pagination.hasMore ?? newReferrals.length >= 20,
        });
      }

      return response;
    } catch (err) {
      console.error('Error fetching referral list:', err);
      throw err;
    }
  }, []);

  // Load more referrals
  const loadMoreReferrals = useCallback(async () => {
    if (!referralPagination.hasMore) return;
    return fetchReferralList(referralPagination.page + 1);
  }, [referralPagination, fetchReferralList]);

  // Fetch tier status
  const fetchTierStatus = useCallback(async (forceRefresh = false) => {
    try {
      const response = await getMyTier(forceRefresh);
      if (response.success) {
        const data = response.data;
        // The API returns progress.nextTier as an object: { tier, benefits, progress: { jobs, rating } }
        const nextTierData = data.progress?.nextTier;

        // Normalize the nested API response to flat structure expected by TierScreen
        setTierStatus({
          tier: data.tier?.current,
          currentTier: data.tier?.current,
          previousTier: data.tier?.previous,
          userType: data.tier?.userType,
          tierUpdatedAt: data.tier?.updatedAt,
          // Metrics
          totalSpend: data.metrics?.totalSpend,
          jobsCompleted: data.metrics?.jobsCompleted,
          averageRating: data.metrics?.averageRating,
          acceptanceRate: data.metrics?.acceptanceRate,
          evaluationWindowStart: data.metrics?.evaluationWindowStart,
          // Progress - extract tier name string from nested object
          nextTier: nextTierData?.tier,
          progressPercentage: nextTierData?.overallProgress,
          // Progress to next tier - jobs and rating requirements
          progressToNext: {
            jobs: nextTierData?.progress?.jobs,
            rating: nextTierData?.progress?.rating,
          },
          progress: {
            jobs: nextTierData?.progress?.jobs,
            rating: nextTierData?.progress?.rating,
          },
          // Benefits
          bonusRate: data.benefits?.bonusRate || 0,
          currentBenefits: data.benefits,
        });
      }
      return response;
    } catch (err) {
      console.error('Error fetching tier status:', err);
      throw err;
    }
  }, []);

  // Fetch tier benefits
  const fetchTierBenefits = useCallback(async (forceRefresh = false) => {
    try {
      const response = await getTierBenefits(forceRefresh);
      if (response.success) {
        setTierBenefits(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching tier benefits:', err);
      throw err;
    }
  }, []);

  // Fetch signup bonus status
  const fetchSignupStatus = useCallback(async (forceRefresh = false) => {
    try {
      const response = await getSignupStatus(forceRefresh);
      if (response.success) {
        setSignupBonus(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching signup status:', err);
      throw err;
    }
  }, []);

  // Share referral code
  const shareReferralCode = useCallback(async () => {
    if (!referralCode?.code) {
      // Fetch code first if not available
      await fetchReferralCode();
    }

    const code = referralCode?.code;
    if (!code) return;

    const shareUrl = referralCode?.shareUrl || `https://onemarket.app/ref/${code}`;
    const message = `Join OneMarket as a service provider! Use my referral code ${code} during signup and we'll both earn rewards. ${shareUrl}`;

    try {
      const result = await Share.share({
        message,
        title: 'Join OneMarket',
        ...(Platform.OS === 'ios' && { url: shareUrl }),
      });

      return result;
    } catch (err) {
      console.error('Error sharing referral code:', err);
      throw err;
    }
  }, [referralCode, fetchReferralCode]);

  // Pull to refresh
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    invalidateIncentiveCache();

    try {
      await fetchDashboard(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard]);

  // Get tier display info helper
  const getCurrentTierInfo = useCallback(() => {
    if (!tierStatus?.tier) return getTierInfo('starter');
    return getTierInfo(tierStatus.tier);
  }, [tierStatus]);

  // Check if signup bonus is active
  const hasActiveSignupBonus = useCallback(() => {
    return signupBonus?.status === 'pending';
  }, [signupBonus]);

  // Check if user has pending referral rewards
  const hasPendingReferralRewards = useCallback(() => {
    return (referralStats?.pendingReferrals || 0) > 0;
  }, [referralStats]);

  const value = {
    // State
    referralCode,
    referralStats,
    referralList,
    referralPagination,
    tierStatus,
    tierBenefits,
    signupBonus,
    dashboard,
    loading,
    refreshing,
    error,

    // Actions
    fetchDashboard,
    fetchReferralCode,
    fetchReferralStats,
    fetchReferralList,
    loadMoreReferrals,
    fetchTierStatus,
    fetchTierBenefits,
    fetchSignupStatus,
    shareReferralCode,
    refreshAll,

    // Helpers
    getCurrentTierInfo,
    hasActiveSignupBonus,
    hasPendingReferralRewards,
  };

  return (
    <IncentiveContext.Provider value={value}>
      {children}
    </IncentiveContext.Provider>
  );
};

export const useIncentive = () => {
  const context = useContext(IncentiveContext);
  if (!context) {
    throw new Error('useIncentive must be used within an IncentiveProvider');
  }
  return context;
};
