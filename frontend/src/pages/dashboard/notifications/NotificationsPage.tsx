import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, Megaphone, ChevronDown } from 'lucide-react';
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

interface TypeMeta {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  border: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  info:    { icon: <Info className="w-4 h-4" />,          iconBg: 'bg-blue-100',   iconColor: 'text-blue-500',   border: 'border-l-blue-400'   },
  success: { icon: <CheckCircle className="w-4 h-4" />,   iconBg: 'bg-green-100',  iconColor: 'text-green-500',  border: 'border-l-green-400'  },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, iconBg: 'bg-amber-100',  iconColor: 'text-amber-500',  border: 'border-l-amber-400'  },
};

const DEFAULT_META: TypeMeta = {
  icon:      <Megaphone className="w-4 h-4" />,
  iconBg:    'bg-purple-100',
  iconColor: 'text-purple-500',
  border:    'border-l-purple-400',
};

const PAGE_SIZE = 20;

const toUtc = (dt: string): string =>
  /[Zz]|[+\-]\d{2}:\d{2}$/.test(dt) ? dt : dt + 'Z';

const timeAgo = (dt: string): string => {
  const diff = Date.now() - new Date(toUtc(dt)).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatIST = (dt: string): string =>
  new Date(toUtc(dt)).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const DashboardNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [expandedIds,   setExpandedIds]   = useState<Set<string>>(new Set());

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

  const handleRowClick = (id: string, isRead: boolean) => {
    if (!isRead) markRead(id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 flex flex-col items-center gap-2">
          <Bell className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
          <p className="text-xs text-gray-300">Admin announcements will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const meta   = TYPE_META[n.type] ?? DEFAULT_META;
            const isOpen = expandedIds.has(n.id);
            const unread = !n.is_read;

            return (
              <div
                key={n.id}
                className={`rounded-xl border-l-4 ${meta.border} overflow-hidden transition-shadow ${
                  unread
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                {/* Header row — always visible */}
                <button
                  onClick={() => handleRowClick(n.id, n.is_read)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
                >
                  {/* Type icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.iconBg} ${meta.iconColor}`}>
                    {meta.icon}
                  </div>

                  {/* Title + preview / timestamp */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={`text-sm flex-1 truncate ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>
                        {n.title}
                      </p>
                      {unread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    {!isOpen && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatIST(n.created_at)} IST &middot; {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded message */}
                {isOpen && (
                  <div className="px-4 pb-4 ml-11 border-t border-gray-100">
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed pt-3 ${unread ? 'text-gray-700' : 'text-gray-500'}`}>
                      {n.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
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
  );
};

export default DashboardNotificationsPage;
