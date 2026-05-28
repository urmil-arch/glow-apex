const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  AUTH_RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,

  // SMM Panel
  GET_SERVICES: `${API_BASE_URL}/smm/services`,
  ADD_ORDER: `${API_BASE_URL}/smm/add-order`,

  // Cashfree
  CASHFREE_CREATE: `${API_BASE_URL}/payments/cashfree/create`,
  CASHFREE_VERIFY: `${API_BASE_URL}/payments/cashfree/verify`,

  // Stripe
  STRIPE_CREATE: `${API_BASE_URL}/payments/stripe/create`,
  STRIPE_VERIFY: `${API_BASE_URL}/payments/stripe/verify`,

  // Cryptomus
  CRYPTOMUS_CREATE: `${API_BASE_URL}/payments/cryptomus/create`,
  CRYPTOMUS_VERIFY: `${API_BASE_URL}/payments/cryptomus/verify`,

  // Payeer
  PAYEER_CREATE: `${API_BASE_URL}/payments/payeer/create`,
  PAYEER_VERIFY: `${API_BASE_URL}/payments/payeer/verify`,

  // Unified verify router
  PAYMENT_VERIFY: `${API_BASE_URL}/payments/verify`,

  // Contact
  CONTACT_SEND: `${API_BASE_URL}/contact/send`,

  // Admin — Users
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_USERS_STATS: `${API_BASE_URL}/admin/users/stats`,
  ADMIN_USERS_EXPORT: `${API_BASE_URL}/admin/users/export`,

  // Admin — Providers
  ADMIN_PROVIDERS: `${API_BASE_URL}/admin/providers`,

  // Admin — Services & Categories
  ADMIN_SERVICES: `${API_BASE_URL}/admin/services`,
  ADMIN_CATEGORIES: `${API_BASE_URL}/admin/services/categories`,

  // Admin — Settings
  ADMIN_SETTINGS: `${API_BASE_URL}/admin/settings`,

  // Admin — Orders
  ADMIN_ORDERS: `${API_BASE_URL}/admin/orders`,

  // Admin — Routing Config
  ADMIN_ROUTING_CONFIG: `${API_BASE_URL}/admin/routing`,

  // Admin — Support
  ADMIN_SUPPORT_TICKETS: `${API_BASE_URL}/admin/support/tickets`,
  ADMIN_SUPPORT_MESSAGES: `${API_BASE_URL}/admin/support/messages`,

  // Public services (no auth)
  PUBLIC_SERVICES: `${API_BASE_URL}/services`,

  // User orders
  ORDERS: `${API_BASE_URL}/orders`,
  ORDERS_BY_CATEGORY: `${API_BASE_URL}/orders/by-category`,

  // User tickets
  TICKETS: `${API_BASE_URL}/tickets`,
}
