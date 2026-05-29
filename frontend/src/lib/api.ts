import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail
    if (status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/sign-in'
    } else if (status === 403) {
      const isSuspended =
        (typeof detail === 'object' && detail?.reason === 'suspended') ||
        (typeof detail === 'string' && detail.toLowerCase().includes('suspend'))
      if (isSuspended) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/suspended'
      }
    }
    return Promise.reject(error)
  }
)
