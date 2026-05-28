import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Settings,
  Package,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  GitBranch,
  ClipboardList,
  HeadphonesIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { to: '/admin/users', icon: <Users className="h-5 w-5" />, label: 'Users' },
  { to: '/admin/orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { to: '/admin/services', icon: <Package className="h-5 w-5" />, label: 'Services' },
  { to: '/admin/routing', icon: <GitBranch className="h-5 w-5" />, label: 'Routing' },
  { to: '/admin/support', icon: <HeadphonesIcon className="h-5 w-5" />, label: 'Support' },
  { to: '/admin/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnreadTicket, setHasUnreadTicket] = useState(false);

  useEffect(() => {
    api.get(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS, { params: { page_size: 50 } })
      .then((res) => {
        const tickets: { admin_has_unread: boolean }[] = res.data.tickets ?? [];
        setHasUnreadTicket(tickets.some((t) => t.admin_has_unread));
      })
      .catch(() => {/* non-critical, silent */});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/sign-in');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 leading-none">Glow Apex</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const showDot = item.to === '/admin/support' && hasUnreadTicket;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={() => {
                if (item.to === '/admin/support') setHasUnreadTicket(false);
                setSidebarOpen(false);
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-600 pl-[10px]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              {item.label}
              {showDot && (
                <span className="ml-auto w-2 h-2 rounded-full bg-teal-500" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-0.5">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm text-gray-700 truncate font-medium">{user?.email}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="h-5 w-5" />
          Back to Site
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-gray-900">Admin Panel</span>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto text-gray-500 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ clearUnreadDot: () => setHasUnreadTicket(false) }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
