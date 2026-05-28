import { useAuth } from "@/context/AuthContext";
import { CreditCard, Home, LogOut, Menu, Package, Ticket, User, X } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

interface NavItemConfig {
  label: string;
  icon: React.ReactNode;
  to: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: "My Orders", icon: <Package className="w-5 h-5" />, to: "/dashboard/orders" },
  { label: "Payments", icon: <CreditCard className="w-5 h-5" />, to: "/dashboard/payments" },
  { label: "Support", icon: <Ticket className="w-5 h-5" />, to: "/dashboard/tickets" },
  { label: "Profile", icon: <User className="w-5 h-5" />, to: "/dashboard/profile" },
];

const getPageTitle = (pathname: string): string => {
  if (pathname.includes("payments")) return "Payments";
  if (pathname.includes("tickets")) return "Support Tickets";
  if (pathname.includes("profile")) return "Profile Settings";
  return "My Orders";
};

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [hasUnreadTicket, setHasUnreadTicket] = useState(false);

  useEffect(() => {
    const check = () => {
      const large = window.innerWidth >= 1024;
      setIsLarge(large);
      setSidebarOpen(large);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get(API_ENDPOINTS.TICKETS, { params: { page_size: 50 } })
      .then((res) => {
        const tickets: { user_has_unread: boolean }[] = res.data.tickets ?? [];
        setHasUnreadTicket(tickets.some((t) => t.user_has_unread));
      })
      .catch(() => {/* non-critical, silent */});
  }, [user, location.pathname]);

  const pathname = location.pathname;

  const isActive = (to: string): boolean => {
    if (to === "/dashboard/orders") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/orders");
    }
    if (to === "/dashboard/tickets") {
      return pathname.startsWith("/dashboard/tickets");
    }
    return pathname.startsWith(to);
  };

  const closeSidebarOnMobile = () => {
    if (!isLarge) setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
          <Link
            to="/sign-in"
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && !isLarge && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <Link
            to="/"
            className="text-lg font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent"
          >
            Glow-Apex
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const showDot = item.to === "/dashboard/tickets" && hasUnreadTicket && !isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (item.to === "/dashboard/tickets") setHasUnreadTicket(false);
                  closeSidebarOnMobile();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.to)
                    ? "bg-teal-50 text-teal-700 border-l-2 border-teal-500"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                {item.label}
                {showDot && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-teal-500" />
                )}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-1">
            <Link
              to="/"
              onClick={closeSidebarOnMobile}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-800">{getPageTitle(pathname)}</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/profile")}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              pathname.includes("profile")
                ? "bg-gradient-to-br from-teal-400 to-emerald-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet context={{ clearUnreadDot: () => setHasUnreadTicket(false) }} />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden sticky bottom-0 bg-white border-t border-gray-100 flex z-10">
          {NAV_ITEMS.map((item) => {
            const showDot = item.to === "/dashboard/tickets" && hasUnreadTicket && !isActive(item.to);
            return (
              <button
                key={item.to}
                onClick={() => {
                  if (item.to === "/dashboard/tickets") setHasUnreadTicket(false);
                  navigate(item.to);
                }}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive(item.to) ? "text-teal-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-500 border border-white" />
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
