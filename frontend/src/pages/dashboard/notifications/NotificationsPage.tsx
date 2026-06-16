import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, Megaphone } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  info:    <Info          className="w-4 h-4 text-blue-500"   />,
  success: <CheckCircle   className="w-4 h-4 text-green-500"  />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500"  />,
};

const PAGE_SIZE = 20;

const timeAgo = (dt: string): string => {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const DashboardNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<{ notifications: Notification[]; total: number }>(
        API_ENDPOINTS.USER_NOTIFICATIONS,
        { params: { page: p, page_size: PAGE_SIZE } },
      );
      setNotifications(res.data.notifications ?? []);
      setTotal(res.data.total ?? 0);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(page); }, [page, fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.post(`${API_ENDPOINTS.USER_NOTIFICATIONS}/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch { /* non-critical */ }
  };

  const markAllRead = async () => {
    try {
      await api.post(API_ENDPOINTS.USER_NOTIFICATIONS_READ_ALL);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* non-critical */ }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalPages  = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <Bell className="w-10 h-10 text-gray-200" />
            <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-300">Admin announcements will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id); }}
                disabled={n.is_read}
                className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors ${
                  !n.is_read
                    ? 'bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer border-l-4 border-emerald-400'
                    : 'border-l-4 border-transparent'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  !n.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'
                }`}>
                  {TYPE_ICON[n.type] ?? <Megaphone className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${
                    !n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'
                  }`}>
                    {n.title}
                  </p>
                  <p className={`text-sm mt-0.5 ${!n.is_read ? 'text-gray-700' : 'text-gray-400'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNotificationsPage;
