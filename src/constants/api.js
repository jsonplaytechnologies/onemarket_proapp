export const API_BASE_URL =
  'https://onemarketbackend-production-27c2.up.railway.app';
// export const API_BASE_URL = 'http://192.168.29.45:5000';

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  SIGNUP: '/api/auth/signup',
  ME: '/api/auth/me',

  // Pro Profile
  PRO_PROFILE: '/api/pros/me/profile',
  PRO_ONLINE_TOGGLE: '/api/pros/me/online',
  PRO_AVAILABILITY: '/api/pros/me/availability',
  PRO_DOCUMENTS: '/api/pros/me/documents',
  PRO_SUBMIT: '/api/pros/me/submit',
  PRO_REAPPLY: '/api/pros/me/reapply',

  // Pro Services
  ALL_SERVICES: '/api/services',
  MY_SERVICES: '/api/pros/me/services',
  MY_SERVICE: (id) => `/api/pros/me/services/${id}`,

  // Zones
  ZONES_ALL: '/api/zones/all',
  MY_ZONES: '/api/pros/me/zones',
  MY_ZONES_BULK: '/api/pros/me/zones/bulk',
  MY_ZONE: (id) => `/api/pros/me/zones/${id}`,

  // Bookings
  BOOKINGS: '/api/bookings',
  BOOKING_DETAILS: (id) => `/api/bookings/${id}`,
  BOOKING_ACCEPT_ASSIGNMENT: (id) => `/api/bookings/${id}/accept-assignment`,
  BOOKING_REJECT_ASSIGNMENT: (id) => `/api/bookings/${id}/reject-assignment`,
  BOOKING_QUOTE: (id) => `/api/bookings/${id}/quote`,
  BOOKING_ANSWERS: (id) => `/api/bookings/${id}/answers`,
  BOOKING_ON_THE_WAY: (id) => `/api/bookings/${id}/on-the-way`,
  BOOKING_START: (id) => `/api/bookings/${id}/start`,
  BOOKING_COMPLETE: (id) => `/api/bookings/${id}/complete`,
  BOOKING_CANCEL: (id) => `/api/bookings/${id}/cancel`,
  BOOKING_MESSAGES: (id) => `/api/bookings/${id}/messages`,
  BOOKING_MESSAGES_IMAGE: (id) => `/api/bookings/${id}/messages/image`,
  BOOKING_MESSAGES_READ: (id) => `/api/bookings/${id}/messages/read`,
  BOOKING_HISTORY: (id) => `/api/bookings/${id}/history`,

  // Earnings & Wallet
  EARNINGS: '/api/pros/me/earnings',
  TRANSACTIONS: '/api/pros/me/transactions',
  TRANSACTION_DETAILS: (id) => `/api/pros/me/transactions/${id}`,

  // Withdrawals
  WITHDRAWALS: '/api/pros/me/withdrawals',
  WITHDRAWAL_DETAILS: (id) => `/api/pros/me/withdrawals/${id}`,

  // Reviews
  MY_REVIEWS: '/api/pros/me/reviews',
  PRO_REVIEWS: (proId) => `/api/reviews/pro/${proId}`,

  // Conversations/Chats
  CONVERSATIONS: '/api/pros/me/conversations',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',
  NOTIFICATIONS_STATUS: '/api/notifications/status', // Combined endpoint for all unread counts
  NOTIFICATION_READ: (id) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',

  // Phase 2 - Duration Options
  BOOKING_DURATION_OPTIONS: '/api/bookings/duration-options',

  // Phase 2 - Provider Availability Management
  MY_AVAILABILITY: '/api/pros/me/availability',
  PRO_AVAILABILITY_GET: '/api/pros/me/availability',
  PRO_AVAILABILITY_SET: '/api/pros/me/availability',
  AVAILABILITY_SLOT: (id) => `/api/pros/me/availability/${id}`,

  // Phase 2 - Provider Ranking & Stats
  MY_RANKING: '/api/pros/me/ranking',

  // Incentive & Referral System
  REFERRAL_MY_CODE: '/api/referrals/my-code',
  REFERRAL_STATS: '/api/referrals/stats',
  REFERRAL_LIST: '/api/referrals/list',
  REFERRAL_VALIDATE: '/api/referrals/validate',

  TIER_MY_TIER: '/api/tiers/my-tier',
  TIER_BENEFITS: '/api/tiers/benefits',
  TIER_HISTORY: '/api/tiers/history',

  INCENTIVE_SIGNUP_STATUS: '/api/incentives/signup-status',
  INCENTIVE_DASHBOARD: '/api/incentives/dashboard',
};
