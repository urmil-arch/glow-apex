import React from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/AuthContext'
import { ServicesProvider } from './context/ServicesContext'
import Navbar from './components/navbar'
import Footer from './components/footer'

// Pages
import HomePage from './pages/Home'
import BuyYoutubeViews from './pages/services/BuyYoutubeViews'
import BuyYoutubeVideoLikes from './pages/services/BuyYoutubeVideoLikes'
import BuyYoutubeSubscribers from './pages/services/BuyYoutubeSubscribers'
import BuyYoutubeComments from './pages/services/BuyYoutubeComments'
import BuyYoutubeShortsViews from './pages/services/BuyYoutubeShortsViews'
import BuyYoutubeShortsLikes from './pages/services/BuyYoutubeShortsLikes'
import ServiceDetail from './pages/services/ServiceDetail'
import ServicesListPage from './pages/services/ServicesListPage'
import TargetedCountry from './pages/services/TargetedCountry'
import CheckoutPage from './pages/checkout/CheckoutPage'
import CheckStatus from './pages/checkout/CheckStatus'
import StripeSuccess from './pages/checkout/StripeSuccess'
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
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersPage from './pages/admin/users/UsersPage'
import ServicesPage from './pages/admin/services/ServicesPage'
import SettingsPage from './pages/admin/settings/SettingsPage'
import ProviderConfigPage from './pages/admin/routing/ProviderConfigPage'
import AdminOrdersPage from './pages/admin/orders/OrdersPage'
import AdminSupportPage from './pages/admin/support/SupportPage'
import TicketsPage from './pages/dashboard/tickets/TicketsPage'
import TicketThreadPage from './pages/dashboard/tickets/TicketThreadPage'

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
      <AuthProvider>
        <ServicesProvider>
          <Routes>
            {/* Public routes with Navbar + Footer */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/:service_id/buy-youtube-views" element={<BuyYoutubeViews />} />
              <Route path="/:service_id/buy-youtube-video-likes" element={<BuyYoutubeVideoLikes />} />
              <Route path="/:service_id/buy-youtube-subscribers" element={<BuyYoutubeSubscribers />} />
              <Route path="/:service_id/buy-youtube-comments" element={<BuyYoutubeComments />} />
              <Route path="/:service_id/buy-youtube-shorts-views" element={<BuyYoutubeShortsViews />} />
              <Route path="/:service_id/buy-youtube-shorts-likes" element={<BuyYoutubeShortsLikes />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/targeted-country" element={<TargetedCountry />} />
              <Route path="/blogs" element={<AllBlogsPage />} />
              <Route path="/blogs/:slug" element={<BlogSlugPage />} />
              <Route path="/contact-us" element={<ContactPage />} />
              <Route path="/services" element={<ServicesListPage />} />
            </Route>

            {/* Checkout routes (no sidebar, but keep Navbar) */}
            <Route element={<><Navbar /><Outlet /></>}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<StripeSuccess />} />
              <Route path="/checkout/cancel" element={<StripeCancel />} />
              <Route path="/checkout/check-status/:orderid" element={<CheckStatus />} />
            </Route>

            {/* Auth routes (no Navbar/Footer) */}
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />

            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OrderPage />} />
              <Route path="orders" element={<OrderPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/:ticketId" element={<TicketThreadPage />} />
            </Route>

            {/* Admin routes — requires is_admin */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="routing" element={<ProviderConfigPage />} />
                <Route path="support" element={<AdminSupportPage />} />
              </Route>
            </Route>
          </Routes>
        </ServicesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
