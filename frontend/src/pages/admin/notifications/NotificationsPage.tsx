import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Send, Trash2, Users, User, Globe, Search, X,
  Info, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  target: 'all' | 'selective' | 'personal';
  user_ids: string[];
  read_count: number;
  created_by: string;
  created_at: string;
}

interface UserResult {
  id: string;
  email: string;
  full_name: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  info:    { label: 'Info',    color: 'bg-blue-100 text-blue-700',    icon: <Info          className="w-3.5 h-3.5" /> },
  success: { label: 'Success', color: 'bg-green-100 text-green-700',  icon: <CheckCircle   className="w-3.5 h-3.5" /> },
  warning: { label: 'Warning', color: 'bg-amber-100 text-amber-700',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const TARGET_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  all:       { label: 'All Users',  icon: <Globe className="w-3.5 h-3.5" /> },
  selective: { label: 'Selective',  icon: <Users className="w-3.5 h-3.5" /> },
  personal:  { label: 'Personal',   icon: <User  className="w-3.5 h-3.5" /> },
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

const AdminNotificationsPage = () => {
  // ── Compose state ──────────────────────────────────────────────────────────
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [type,    setType]    = useState<'info' | 'success' | 'warning'>('info');
  const [target,  setTarget]  = useState<'all' | 'selective' | 'personal'>('all');
  const [selectedUsers,  setSelectedUsers]  = useState<UserResult[]>([]);
  const [userSearch,     setUserSearch]     = useState('');
  const [userResults,    setUserResults]    = useState<UserResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // ── History state ──────────────────────────────────────────────────────────
  const [notifications,   setNotifications]   = useState<Notification[]>([]);
  const [total,           setTotal]           = useState(0);
  const [page,            setPage]            = useState(1);
  const [historyLoading,  setHistoryLoading]  = useState(false);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (p: number) => {
    setHistoryLoading(true);
    try {
      const res = await api.get<{ notifications: Notification[]; total: number }>(
        API_ENDPOINTS.ADMIN_NOTIFICATIONS,
        { params: { page: p, page_size: PAGE_SIZE } },
      );
      setNotifications(res.data.notifications);
      setTotal(res.data.total);
    } catch { /* non-critical */ } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(page); }, [page, fetchHistory]);

  // ── Debounced user search ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userSearch.trim() || target === 'all') { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get<{ users: UserResult[] }>(
          API_ENDPOINTS.ADMIN_USERS,
          { params: { search: userSearch, page_size: 10 } },
        );
        setUserResults(res.data.users ?? []);
      } catch {
        setUserResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, target]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setUserResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addUser = (u: UserResult) => {
    if (!selectedUsers.find(s => s.id === u.id)) {
      setSelectedUsers(prev => [...prev, u]);
    }
    setUserSearch('');
    setUserResults([]);
  };

  const removeUser = (id: string) => setSelectedUsers(prev => prev.filter(u => u.id !== id));

  // ── Send notification ──────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    if (!title.trim() || !message.trim()) {
      setSendError('Title and message are required.');
      return;
    }
    if (target !== 'all' && selectedUsers.length === 0) {
      setSendError('Select at least one user.');
      return;
    }
    setSending(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN_NOTIFICATIONS, {
        title:    title.trim(),
        message:  message.trim(),
        type,
        target,
        user_ids: selectedUsers.map(u => u.id),
      });
      setTitle('');
      setMessage('');
      setType('info');
      setTarget('all');
      setSelectedUsers([]);
      setPage(1);
      fetchHistory(1);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string | { msg: string }[] } } })
        ?.response?.data?.detail;
      setSendError(
        Array.isArray(detail) ? (detail[0]?.msg ?? 'Failed to send') :
        typeof detail === 'string' ? detail : 'Failed to send notification.',
      );
    } finally {
      setSending(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`${API_ENDPOINTS.ADMIN_NOTIFICATIONS}/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch { /* non-critical */ }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send announcements and alerts to users</p>
      </div>

      {/* ── Compose panel ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Send className="w-4 h-4" />
          Compose Notification
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Notification title"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Notification body…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'info' | 'success' | 'warning')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
            <select
              value={target}
              onChange={e => {
                setTarget(e.target.value as 'all' | 'selective' | 'personal');
                setSelectedUsers([]);
                setUserSearch('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Users</option>
              <option value="selective">Selective</option>
              <option value="personal">Personal (one user)</option>
            </select>
          </div>
        </div>

        {/* User picker for selective / personal */}
        {target !== 'all' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {target === 'personal' ? 'User' : 'Users'}
            </label>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map(u => (
                  <span key={u.id} className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full">
                    {u.email}
                    <button type="button" onClick={() => removeUser(u.id)} className="hover:text-teal-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {(target === 'selective' || selectedUsers.length === 0) && (
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by email or name…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {(userResults.length > 0 || searchLoading) && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {searchLoading ? (
                      <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
                    ) : (
                      userResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addUser(u)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-800">{u.full_name}</span>
                          <span className="text-gray-400 ml-1.5 text-xs">{u.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {sendError && <p className="text-sm text-red-500">{sendError}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      </form>

      {/* ── History ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">History</h2>
          <span className="text-sm text-gray-400">{total} sent</span>
        </div>

        {historyLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">No notifications sent yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[n.type].color}`}>
                        {TYPE_CONFIG[n.type].icon}
                        {TYPE_CONFIG[n.type].label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {TARGET_CONFIG[n.target].icon}
                        {TARGET_CONFIG[n.target].label}
                        {n.target !== 'all' && n.user_ids.length > 0 && ` (${n.user_ids.length})`}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      By {n.created_by} &middot; {n.read_count} read
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
