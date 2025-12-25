/**
 * Ranking Service - Phase 2
 *
 * Provider performance ranking and statistics
 * Tracks trust score, job confidence, and best provider score
 */

import apiService from './api';
import { API_ENDPOINTS } from '../constants/api';

class RankingService {
  /**
   * ============================================================================
   * RANKING & STATS
   * ============================================================================
   */

  /**
   * Get provider's ranking statistics
   *
   * @returns {Promise<Object>} Ranking stats
   * {
   *   trust_score: number,           // 0-5, EMA of ratings
   *   job_confidence: number,        // 0-1, based on completed jobs
   *   best_provider_score: number,   // trust_score × job_confidence
   *   completed_bookings: number,
   *   average_rating: number,
   *   rank_percentile: number        // Your rank compared to others
   * }
   */
  async getRankingStats() {
    try {
      const response = await apiService.get(API_ENDPOINTS.MY_RANKING);
      return response;
    } catch (error) {
      console.error('Error fetching ranking stats:', error);
      throw error;
    }
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  /**
   * Calculate job confidence from completed jobs
   * Formula: min(completed_jobs / 50, 1.0)
   *
   * @param {number} completedJobs - Number of completed jobs
   * @returns {number} Job confidence (0-1)
   */
  calculateJobConfidence(completedJobs) {
    return Math.min(completedJobs / 50, 1.0);
  }

  /**
   * Calculate best provider score
   * Formula: trust_score × job_confidence
   *
   * @param {number} trustScore - Trust score (0-5)
   * @param {number} jobConfidence - Job confidence (0-1)
   * @returns {number} Best provider score
   */
  calculateBestProviderScore(trustScore, jobConfidence) {
    return trustScore * jobConfidence;
  }

  /**
   * Get rank tier based on score
   *
   * @param {number} score - Best provider score
   * @returns {Object} { tier, label, color, icon }
   */
  getRankTier(score) {
    if (score >= 4.5) {
      return {
        tier: 'platinum',
        label: 'Platinum',
        color: '#E5E7EB',
        icon: 'star',
        description: 'Top 5% of providers'
      };
    } else if (score >= 3.5) {
      return {
        tier: 'gold',
        label: 'Gold',
        color: '#FCD34D',
        icon: 'trophy',
        description: 'Top 20% of providers'
      };
    } else if (score >= 2.5) {
      return {
        tier: 'silver',
        label: 'Silver',
        color: '#D1D5DB',
        icon: 'ribbon',
        description: 'Top 50% of providers'
      };
    } else if (score >= 1.5) {
      return {
        tier: 'bronze',
        label: 'Bronze',
        color: '#CD7F32',
        icon: 'medal',
        description: 'Established provider'
      };
    } else {
      return {
        tier: 'starter',
        label: 'Starter',
        color: '#9CA3AF',
        icon: 'person',
        description: 'New provider'
      };
    }
  }

  /**
   * Format score for display
   *
   * @param {number} score - Score value
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted score
   */
  formatScore(score, decimals = 2) {
    if (typeof score !== 'number') return 'N/A';
    return score.toFixed(decimals);
  }

  /**
   * Get progress to next tier
   *
   * @param {number} currentScore - Current score
   * @returns {Object} { nextTier, currentProgress, required, percentage }
   */
  getProgressToNextTier(currentScore) {
    const tiers = [
      { threshold: 0, label: 'Starter' },
      { threshold: 1.5, label: 'Bronze' },
      { threshold: 2.5, label: 'Silver' },
      { threshold: 3.5, label: 'Gold' },
      { threshold: 4.5, label: 'Platinum' }
    ];

    // Find current tier
    let currentTierIndex = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentScore >= tiers[i].threshold) {
        currentTierIndex = i;
        break;
      }
    }

    // Check if already at top tier
    if (currentTierIndex === tiers.length - 1) {
      return {
        nextTier: 'Maximum',
        currentProgress: currentScore,
        required: tiers[currentTierIndex].threshold,
        percentage: 100
      };
    }

    const currentTier = tiers[currentTierIndex];
    const nextTier = tiers[currentTierIndex + 1];

    const range = nextTier.threshold - currentTier.threshold;
    const progress = currentScore - currentTier.threshold;
    const percentage = (progress / range) * 100;

    return {
      nextTier: nextTier.label,
      currentProgress: currentScore,
      required: nextTier.threshold,
      percentage: Math.min(percentage, 100)
    };
  }

  /**
   * Get performance insights based on stats
   *
   * @param {Object} stats - Ranking stats
   * @returns {Array<Object>} Array of insights
   */
  getPerformanceInsights(stats) {
    const insights = [];

    // Trust score insights
    if (stats.trust_score < 4.0) {
      insights.push({
        type: 'warning',
        title: 'Improve Your Rating',
        message: 'Focus on quality service to increase your trust score.',
        action: 'View tips'
      });
    } else if (stats.trust_score >= 4.5) {
      insights.push({
        type: 'success',
        title: 'Excellent Rating!',
        message: 'Your high trust score gives you priority for bookings.',
        action: null
      });
    }

    // Job confidence insights
    const jobsToGo = Math.max(0, 50 - stats.completed_bookings);
    if (stats.job_confidence < 1.0) {
      insights.push({
        type: 'info',
        title: 'Complete More Jobs',
        message: `${jobsToGo} more jobs to reach maximum job confidence.`,
        action: null
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Experienced Provider',
        message: 'You have maximum job confidence!',
        action: null
      });
    }

    // Ranking insights
    if (stats.rank_percentile >= 75) {
      insights.push({
        type: 'success',
        title: `Top ${100 - stats.rank_percentile}%`,
        message: 'You rank higher than most providers!',
        action: null
      });
    } else if (stats.rank_percentile < 50) {
      insights.push({
        type: 'info',
        title: 'Room for Growth',
        message: 'Complete more jobs with high ratings to improve your rank.',
        action: 'Learn more'
      });
    }

    return insights;
  }

  /**
   * Calculate estimated monthly bookings based on score
   *
   * @param {number} score - Best provider score
   * @param {number} baseBookings - Average bookings per month in area
   * @returns {number} Estimated monthly bookings
   */
  estimateMonthlyBookings(score, baseBookings = 20) {
    // Higher score = more bookings (linear relationship)
    const multiplier = Math.max(0.2, Math.min(2.0, score / 2.5));
    return Math.round(baseBookings * multiplier);
  }

  /**
   * Get star rating display
   *
   * @param {number} rating - Rating value (0-5)
   * @returns {Object} { full, half, empty }
   */
  getStarRating(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    return {
      full,
      half: hasHalf ? 1 : 0,
      empty
    };
  }

  /**
   * Format percentile for display
   *
   * @param {number} percentile - Percentile value (0-100)
   * @returns {string} Formatted percentile
   */
  formatPercentile(percentile) {
    if (percentile >= 75) {
      return `Top ${100 - percentile}%`;
    } else if (percentile >= 50) {
      return `Top ${100 - percentile}%`;
    } else {
      return `Bottom ${100 - percentile}%`;
    }
  }

  /**
   * Get recommended actions to improve ranking
   *
   * @param {Object} stats - Ranking stats
   * @returns {Array<Object>} Array of recommended actions
   */
  getRecommendedActions(stats) {
    const actions = [];

    // If low rating
    if (stats.average_rating < 4.0) {
      actions.push({
        priority: 'high',
        title: 'Improve Service Quality',
        description: 'Focus on delivering excellent service to increase your rating',
        tips: [
          'Arrive on time',
          'Communicate clearly with customers',
          'Be professional and courteous',
          'Ensure high-quality work'
        ]
      });
    }

    // If low job count
    if (stats.completed_bookings < 10) {
      actions.push({
        priority: 'high',
        title: 'Complete More Jobs',
        description: 'Building experience increases your job confidence',
        tips: [
          'Accept more bookings',
          'Expand your service areas',
          'Offer competitive quotes'
        ]
      });
    }

    // If moderate experience
    if (stats.completed_bookings >= 10 && stats.completed_bookings < 50) {
      actions.push({
        priority: 'medium',
        title: 'Build Your Reputation',
        description: 'Keep completing jobs to reach maximum confidence',
        tips: [
          'Maintain consistent quality',
          'Ask satisfied customers for reviews',
          'Build a portfolio of completed work'
        ]
      });
    }

    // If good score but can improve
    if (stats.best_provider_score >= 2.5 && stats.best_provider_score < 4.5) {
      actions.push({
        priority: 'medium',
        title: 'Reach the Top Tier',
        description: 'You\'re doing well! A few improvements can get you to platinum',
        tips: [
          'Maintain your current rating',
          'Complete a few more jobs',
          'Respond quickly to new requests'
        ]
      });
    }

    return actions;
  }
}

export default new RankingService();
