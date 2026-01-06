/**
 * CacheManager - Centralized caching utility for API responses
 * Reduces unnecessary API calls by caching data with TTL
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();

    // Default TTL values (in milliseconds)
    this.TTL = {
      profile: 5 * 60 * 1000,      // 5 minutes for profile data
      earnings: 2 * 60 * 1000,      // 2 minutes for earnings
      bookings: 30 * 1000,          // 30 seconds for bookings list
      booking: 30 * 1000,           // 30 seconds for single booking
      notifications: 30 * 1000,     // 30 seconds for notifications
      ranking: 5 * 60 * 1000,       // 5 minutes for ranking
      services: 10 * 60 * 1000,     // 10 minutes for services
      zones: 30 * 60 * 1000,        // 30 minutes for zones
      default: 60 * 1000,           // 1 minute default
      // Incentive system TTLs
      incentive: 30 * 1000,         // 30 seconds for incentive data
      tier: 30 * 1000,              // 30 seconds for tier status
      tierBenefits: 30 * 1000,      // 30 seconds for tier benefits
    };
  }

  /**
   * Get cached data if valid
   * @param {string} key - Cache key
   * @param {string} type - Type of data for TTL lookup
   * @returns {any|null} - Cached data or null if expired/missing
   */
  get(key, type = 'default') {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = this.TTL[type] || this.TTL.default;
    const age = Date.now() - item.timestamp;

    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if data is stale (older than TTL)
   * @param {string} key - Cache key
   * @param {string} type - Type of data for TTL lookup
   * @returns {boolean} - True if stale or missing
   */
  isStale(key, type = 'default') {
    const item = this.cache.get(key);
    if (!item) return true;

    const ttl = this.TTL[type] || this.TTL.default;
    return Date.now() - item.timestamp > ttl;
  }

  /**
   * Invalidate specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'booking:')
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Deduplicate requests - returns existing promise if same request is in-flight
   * @param {string} key - Request key
   * @param {Function} fetchFn - Function that returns a promise
   * @returns {Promise} - The fetch promise
   */
  async deduplicatedFetch(key, fetchFn) {
    // Return existing in-flight request if present
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = fetchFn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get or fetch - returns cached data or fetches if stale
   * @param {string} key - Cache key
   * @param {string} type - Cache type for TTL
   * @param {Function} fetchFn - Function to fetch data if needed
   * @param {boolean} forceRefresh - Force refresh ignoring cache
   * @returns {Promise<{data: any, fromCache: boolean}>}
   */
  async getOrFetch(key, type, fetchFn, forceRefresh = false) {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = this.get(key, type);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }
    }

    // Fetch with deduplication
    const data = await this.deduplicatedFetch(key, fetchFn);

    // Cache the result
    if (data !== null && data !== undefined) {
      this.set(key, data);
    }

    return { data, fromCache: false };
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Cache keys constants
export const CACHE_KEYS = {
  PROFILE: 'profile',
  EARNINGS: 'earnings',
  EARNINGS_TODAY: 'earnings:today',
  EARNINGS_ALL: 'earnings:all',
  BOOKINGS: 'bookings',
  BOOKING: (id) => `booking:${id}`,
  BOOKING_ANSWERS: (id) => `booking:${id}:answers`,
  NOTIFICATIONS: 'notifications',
  UNREAD_COUNT: 'unread_count',
  UNREAD_CHATS_COUNT: 'unread_chats_count',
  RANKING: 'ranking',
  SERVICES: 'services',
  MY_SERVICES: 'my_services',
  ZONES: 'zones',
  MY_ZONES: 'my_zones',
  ONLINE_STATUS: 'online_status',
  AVAILABILITY: 'availability',
  REVIEWS: 'reviews',
  TRANSACTIONS: 'transactions',
  WITHDRAWALS: 'withdrawals',
  // Incentive system cache keys
  REFERRAL_CODE: 'referral:code',
  REFERRAL_STATS: 'referral:stats',
  TIER_STATUS: 'tier:status',
  TIER_BENEFITS: 'tier:benefits',
  SIGNUP_STATUS: 'signup:status',
  INCENTIVE_DASHBOARD: 'incentive:dashboard',
};

// Cache types for TTL
export const CACHE_TYPES = {
  PROFILE: 'profile',
  EARNINGS: 'earnings',
  BOOKINGS: 'bookings',
  BOOKING: 'booking',
  NOTIFICATIONS: 'notifications',
  RANKING: 'ranking',
  SERVICES: 'services',
  ZONES: 'zones',
  DEFAULT: 'default',
  // Incentive system cache types
  INCENTIVE: 'incentive',
  TIER: 'tier',
  TIER_BENEFITS: 'tierBenefits',
};

export default cacheManager;
