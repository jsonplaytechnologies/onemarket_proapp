export const API_BASE_URL = 'https://onemarketbackend-production.up.railway.app';

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  SIGNUP: '/api/auth/signup',
  ME: '/api/auth/me',

  // Pro Profile
  PRO_PROFILE: '/api/pros/me/profile',
  PRO_AVAILABILITY: '/api/pros/me/availability',
  PRO_DOCUMENTS: '/api/pros/me/documents',

  // Pro Services
  ALL_SERVICES: '/api/services',
  MY_SERVICES: '/api/pros/me/services',
  MY_SERVICE: (id) => `/api/pros/me/services/${id}`,

  // Zones
  ZONES_ALL: '/api/zones/all',
  MY_ZONES: '/api/pros/me/zones',
  MY_ZONE: (id) => `/api/pros/me/zones/${id}`,

  // Bookings
  BOOKINGS: '/api/bookings',
  BOOKING_DETAILS: (id) => `/api/bookings/${id}`,
  BOOKING_ACCEPT: (id) => `/api/bookings/${id}/accept`,
  BOOKING_REJECT: (id) => `/api/bookings/${id}/reject`,
  BOOKING_QUOTATION: (id) => `/api/bookings/${id}/quotation`,
  BOOKING_ON_THE_WAY: (id) => `/api/bookings/${id}/on-the-way`,
  BOOKING_START: (id) => `/api/bookings/${id}/start`,
  BOOKING_COMPLETE: (id) => `/api/bookings/${id}/complete`,
  BOOKING_CANCEL: (id) => `/api/bookings/${id}/cancel`,
  BOOKING_MESSAGES: (id) => `/api/bookings/${id}/messages`,
  BOOKING_MESSAGES_IMAGE: (id) => `/api/bookings/${id}/messages/image`,
  BOOKING_MESSAGES_READ: (id) => `/api/bookings/${id}/messages/read`,

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
  NOTIFICATION_READ: (id) => `/api/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/api/notifications/read-all',
};
