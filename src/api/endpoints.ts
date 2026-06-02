export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SEED: '/auth/seed',
  },
  ORDERS: {
    BASE: '/orders',
    MY_ORDERS: '/orders/my',
    RIDER_ORDERS: '/orders/rider',
    STATUS: (id: string) => `/orders/${id}/status`,
  },
  RIDERS: {
    BASE: '/riders',
    STATUS: (id: string) => `/riders/${id}/status`,
    LOCATION: '/riders/location',
    LOCATIONS: '/riders/locations',
  },
  ANALYTICS: {
    SUMMARY: '/analytics/summary',
  },
};
