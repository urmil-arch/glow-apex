import React, { useEffect, useState } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ServicesProvider } from './context/ServicesContext'
import { CurrencyProvider } from './context/CurrencyContext'
import Navbar from './components/navbar'
import Footer from './components/footer'
import { api } from './lib/api'
import { API_ENDPOINTS } from './config'
import CheckoutPage from './pages/checkout/CheckoutPage'

// Pages
import HomePage from './pages/Home'
import BuyYoutubeViews from './pages/services/BuyYoutubeViews'
import BuyYoutubeVideoLikes from './pages/services/BuyYoutubeVideoLikes'
import BuyYoutubeSubscribers from './pages/services/BuyYoutubeSubscribers'
import BuyYoutubeComments from './pages/services/BuyYoutubeComments'
import BuyYoutubeShortsViews from './pages/services/BuyYoutubeShortsViews'
import BuyYoutubeShortsLikes from './pages/services/BuyYoutubeShortsLikes'
import ServiceDetail from './pages/services/ServiceDetail'
import TargetedCountry from './pages/services/TargetedCountry'
import CheckStatus from './pages/checkout/CheckStatus'
import StripeCancel from './pages/checkout/StripeCancel'
import AllBlogsPage from './pages/blogs/AllBlogsPage'
import BlogSlugPage from './pages/blogs/BlogSlugPage'
import ContactPage from './pages/contact/ContactPage'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import OrderPage from './pages/dashboard/orders/OrderPage'
import PaymentsPage from './pages/dashboard/payments/PaymentsPage'
import ProfilePage from './pages/dashboard/profile/ProfilePage'
import AdminGuard from './components/admin/AdminGuard'
import RequirePermission from './components/admin/RequirePermission'
import AdminLayout from './pages/admin/AdminLayout'
import UsersPage from './pages/admin/users/UsersPage'
import ServicesPage from './pages/admin/services/ServicesPage'
import SettingsPage from './pages/admin/settings/SettingsPage'
import AdminOrdersPage from './pages/admin/orders/OrdersPage'
import AdminTasksPage from './pages/admin/tasks/TasksPage'
import AdminPaymentsPage from './pages/admin/payments/PaymentsPage'
import AdminReportsPage from './pages/admin/reports/ReportsPage'
import AdminSupportPage from './pages/admin/support/SupportPage'
import AdminBlogsPage from './pages/admin/blogs/BlogsPage'
import AdminNotificationsPage from './pages/admin/notifications/NotificationsPage'
import StaffPage from './pages/admin/staff/StaffPage'
import ServiceStatsPage from './pages/admin/service-stats/ServiceStatsPage'
import TicketsPage from './pages/dashboard/tickets/TicketsPage'
import TicketThreadPage from './pages/dashboard/tickets/TicketThreadPage'
import DashboardNotificationsPage from './pages/dashboard/notifications/NotificationsPage'
import RouteScrollReset from './components/common/route-scroll-reset'
import AdminFAB from './components/common/AdminFAB'
import SuspendedPage from './pages/auth/SuspendedPage'
import MaintenancePage from './pages/MaintenancePage'

// Per-domain landing: buyrealviews.com opens on the Views page, buyrealsubscribers.com
// on the Subscribers page; every other host (localhost, glowapex.com store) gets Home.
const STORE_LANDING: Record<string, React.FC> = {
  'buyrealviews.com': BuyYoutubeViews,
  'buyrealsubscribers.com': BuyYoutubeSubscribers,
}

const RootLanding: React.FC = () => {
  const host = window.location.hostname.replace(/^www\./, '')
  const Landing = STORE_LANDING[host] ?? HomePage
  return <Landing />
}

const AUTH_EXEMPT = ['/sign-in', '/sign-up', '/suspended']

const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth()
  const location = useLocation()
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => {
      api.get<{ maintenance_mode: boolean }>(API_ENDPOINTS.PUBLIC_SETTINGS)
        .then((res) => setMaintenanceMode(res.data.maintenance_mode))
        .catch(() => setMaintenanceMode(false))
    }
    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const isAuthExempt = AUTH_EXEMPT.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  )
  if (isAuthExempt) return <>{children}</>
  if (maintenanceMode === null || authLoading) return null

  const onMaintenancePage = location.pathname === '/maintenance'
  const isAdmin = user?.is_admin === true

  if (maintenanceMode && !isAdmin) {
    return onMaintenancePage ? <>{children}</> : <Navigate to="/maintenance" replace />
  }
  if (onMaintenancePage) return <Navigate to="/" replace />
  return <>{children}</>
}

const SuspensionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const onSuspendedPage = location.pathname === '/suspended'

  if (isLoading) return onSuspendedPage ? null : <>{children}</>

  if (user?.is_suspended) {
    return onSuspendedPage ? <>{children}</> : <Navigate to="/suspended" replace />
  }

  if (onSuspendedPage && user && !user.is_suspended) return <Navigate to="/" replace />

  return <>{children}</>
}

const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user?.is_admin) return <Navigate to="/admin" replace />
  return <>{children}</>
}

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
)

const App: React.FC = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <CurrencyProvider>
      <AuthProvider>
        <ServicesProvider>
          <RouteScrollReset />
          <AdminFAB />
          <MaintenanceGuard>
          <SuspensionGuard>
          <Routes>
            <Route path="/maintenance" element={<MaintenancePage />} />
            {/* Public routes with Navbar + Footer */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<RootLanding />} />
              <Route path="/buy-youtube-views" element={<BuyYoutubeViews />} />
              <Route path="/buy-youtube-video-likes" element={<BuyYoutubeVideoLikes />} />
              <Route path="/buy-youtube-subscribers" element={<BuyYoutubeSubscribers />} />
              <Route path="/buy-youtube-comments" element={<BuyYoutubeComments />} />
              <Route path="/buy-youtube-shorts-views" element={<BuyYoutubeShortsViews />} />
              <Route path="/buy-youtube-shorts-likes" element={<BuyYoutubeShortsLikes />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/targeted-country" element={<TargetedCountry />} />
              <Route path="/blogs" element={<AllBlogsPage />} />
              <Route path="/blogs/:slug" element={<BlogSlugPage />} />
              <Route path="/contact-us" element={<ContactPage />} />
            </Route>

            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Checkout routes (no sidebar, but keep Navbar) */}
            <Route element={<><Navbar /><Outlet /></>}>
              <Route path="/checkout/cancel" element={<StripeCancel />} />
              <Route path="/checkout/check-status/:orderid" element={<CheckStatus />} />
            </Route>

            {/* Auth routes (no Navbar/Footer) */}
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/suspended" element={<SuspendedPage />} />

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OrderPage />} />
              <Route path="orders" element={<OrderPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/:ticketId" element={<TicketThreadPage />} />
              <Route path="notifications" element={<DashboardNotificationsPage />} />
            </Route>

            {/* Admin routes — requires is_admin */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<RequirePermission permission="dashboard"><AdminReportsPage /></RequirePermission>} />
                <Route path="users" element={<RequirePermission permission="users"><UsersPage /></RequirePermission>} />
                <Route path="orders" element={<RequirePermission permission="orders"><AdminOrdersPage /></RequirePermission>} />
                <Route path="tasks" element={<RequirePermission permission="tasks"><AdminTasksPage /></RequirePermission>} />
                <Route path="payments" element={<RequirePermission permission="payments"><AdminPaymentsPage /></RequirePermission>} />
                <Route path="services" element={<RequirePermission permission="services"><ServicesPage /></RequirePermission>} />
                <Route path="settings" element={<RequirePermission permission="settings"><SettingsPage /></RequirePermission>} />
                <Route path="support" element={<RequirePermission permission="support"><AdminSupportPage /></RequirePermission>} />
                <Route path="blogs" element={<RequirePermission permission="blogs"><AdminBlogsPage /></RequirePermission>} />
                <Route path="notifications" element={<RequirePermission permission="notifications"><AdminNotificationsPage /></RequirePermission>} />
                <Route path="staff" element={<AdminOnlyRoute><StaffPage /></AdminOnlyRoute>} />
                <Route path="service-stats" element={<RequirePermission permission="orders"><ServiceStatsPage /></RequirePermission>} />
              </Route>
            </Route>
          </Routes>
          </SuspensionGuard>
          </MaintenanceGuard>
        </ServicesProvider>
      </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App
