const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
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
}
