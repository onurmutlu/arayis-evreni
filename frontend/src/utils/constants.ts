// constants.ts
// Uygulama genelinde kullanılacak sabitler

// API endpoints
export const API_ENDPOINTS = {
  ERROR_REPORT: '/api/error-reports',
  USER_PROFILE: '/profile',
  MISSIONS: '/missions',
  DAILY_BONUS: '/daily-bonus',
  NOTIFICATIONS: '/notifications',
  DAO_PROPOSALS: '/dao/proposals',
  LEADERBOARD: '/leaderboard',
  BADGES: '/api/badges',
  NFTS: '/nfts',
};

// Hata türleri
export const ERROR_TYPES = {
  API_ERROR: 'api_error',
  AUTH_ERROR: 'auth_error',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  RENDER_ERROR: 'render_error',
  UNKNOWN_ERROR: 'unknown_error',
};

// Uygulama temaları ve renkler
export const THEME = {
  PRIMARY: '#8B5CFF',
  SECONDARY: '#FF5CAE',
  SUCCESS: '#5CFF8B',
  WARNING: '#FFBE5C',
  DANGER: '#FF5C5C',
  INFO: '#5CAAFF',
  BACKGROUND: '#0A0E17',
  CARD_BG: '#16192A',
};

// Sistem sabitleri
export const SYSTEM = {
  DEFAULT_PAGINATION_LIMIT: 20,
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 500, // ms
  MAX_RETRIES: 3,
  TOKEN_REFRESH_INTERVAL: 1000 * 60 * 30, // 30 dakika
  LOCAL_STORAGE_PREFIX: 'arayis_',
}; 