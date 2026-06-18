import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Send, Trash2, Users, User, Globe, Search, X,
  Info, CheckCircle, AlertTriangle, Upload, Clock,
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

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  info:    { label: 'Info',    color: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   icon: <Info          className="w-3.5 h-3.5" /> },
  success: { label: 'Success', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: <CheckCircle   className="w-3.5 h-3.5" /> },
  warning: { label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500',  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};
const DEFAULT_TYPE = { label: 'Info', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', icon: <Info className="w-3.5 h-3.5" /> };

const TARGET_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  all:       { label: 'All Users',  icon: <Globe className="w-3 h-3" /> },
  selective: { label: 'Selective',  icon: <Users className="w-3 h-3" /> },
  personal:  { label: 'Personal',   icon: <User  className="w-3 h-3" /> },
};
const DEFAULT_TARGET = { label: 'Unknown', icon: <Globe className="w-3 h-3" /> };

const PAGE_SIZE = 20;

const toUtc = (d: string) => d && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;

const timeAgo = (dt: string): string => {
  const diff = Date.now() - new Date(toUtc(dt)).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtFull = (dt: string) =>
  new Date(toUtc(dt)).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const AdminNotificationsPage = () => {
  // ── Compose state ────────────────────────────────────────────────────────────
  const [title,         setTitle]         = useState('');
  const [message,       setMessage]       = useState('');
  const [type,          setType]          = useState<'info' | 'success' | 'warning'>('info');
  const [target,        setTarget]        = useState<'all' | 'selective' | 'personal'>('all');
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [userSearch,    setUserSearch]    = useState('');
  const [userResults,   setUserResults]   = useState<UserResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sending,       setSending]       = useState(false);
  const [sendError,     setSendError]     = useState('');
  const [importStatus,  setImportStatus]  = useState<{ ok: boolean; msg: string } | null>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ── History state ────────────────────────────────────────────────────────────
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  // ── Fetch history ────────────────────────────────────────────────────────────
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

  // ── Debounced user search ────────────────────────────────────────────────────
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
    if (!selectedUsers.find(s => s.id === u.id)) setSelectedUsers(prev => [...prev, u]);
    setUserSearch('');
    setUserResults([]);
  };

  const removeUser = (id: string) => setSelectedUsers(prev => prev.filter(u => u.id !== id));

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string ?? '').trim();
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) { setImportStatus({ ok: false, msg: 'CSV is empty or has no data rows.' }); return; }
      const headers  = lines[0].split(',').map(h => h.trim().toLowerCase());
      const idIdx    = headers.indexOf('id');
      const emailIdx = headers.indexOf('email');
      const nameIdx  = headers.indexOf('full_name');
      if (idIdx === -1) {
        setImportStatus({
          ok: false,
          msg: emailIdx !== -1
            ? 'Email-only CSV detected — use "Export Users" (not "Export Emails") from the Users page.'
            : 'Invalid CSV. Expected columns: id, full_name, email.',
        });
        return;
      }
      const existingIds = new Set(selectedUsers.map(u => u.id));
      const imported: UserResult[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols      = lines[i].split(',');
        const id        = cols[idIdx]?.trim();
        const email     = cols[emailIdx]?.trim() ?? '';
        const full_name = nameIdx !== -1 ? (cols[nameIdx]?.trim() ?? email) : email;
        if (id && !existingIds.has(id)) { imported.push({ id, email, full_name }); existingIds.add(id); }
      }
      if (imported.length === 0) { setImportStatus({ ok: false, msg: 'All users from the CSV are already added.' }); return; }
      setSelectedUsers(prev => [...prev, ...imported]);
      setImportStatus({ ok: true, msg: `Imported ${imported.length} user${imported.length !== 1 ? 's' : ''}.` });
    };
    reader.readAsText(file);
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    if (!title.trim() || !message.trim()) { setSendError('Title and message are required.'); return; }
    if (target !== 'all' && selectedUsers.length === 0) { setSendError('Select at least one user.'); return; }
    setSending(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN_NOTIFICATIONS, {
        title: title.trim(), message: message.trim(), type, target,
        user_ids: selectedUsers.map(u => u.id),
      });
      setTitle(''); setMessage(''); setType('info'); setTarget('all');
      setSelectedUsers([]); setImportStatus(null);
      setPage(1); fetchHistory(1);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string | { msg: string }[] } } })?.response?.data?.detail;
      setSendError(
        Array.isArray(detail) ? (detail[0]?.msg ?? 'Failed to send') :
        typeof detail === 'string' ? detail : 'Failed to send notification.',
      );
    } finally { setSending(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`${API_ENDPOINTS.ADMIN_NOTIFICATIONS}/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch { /* non-critical */ }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send announcements and alerts to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

        {/* ── LEFT: Compose ───────────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <form onSubmit={handleSend} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Compose Notification</p>
                <p className="text-teal-100 text-xs">Send to users instantly</p>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* Type pills */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-2">
                  {(['info', 'success', 'warning'] as const).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                          type === t
                            ? `${cfg.color} border-current shadow-sm`
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Audience</label>
                <div className="flex gap-2">
                  {([
                    { v: 'all',       icon: <Globe className="w-3.5 h-3.5" />, label: 'All' },
                    { v: 'selective', icon: <Users className="w-3.5 h-3.5" />, label: 'Selective' },
                    { v: 'personal',  icon: <User  className="w-3.5 h-3.5" />, label: 'Personal' },
                  ] as const).map(({ v, icon, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setTarget(v); setSelectedUsers([]); setUserSearch(''); setImportStatus(null); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                        target === v
                          ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User picker */}
              {target !== 'all' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {target === 'personal' ? 'User' : 'Users'}
                    </label>
                    {target === 'selective' && (
                      <>
                        <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                        <button
                          type="button"
                          onClick={() => { setImportStatus(null); csvInputRef.current?.click(); }}
                          className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Import CSV
                        </button>
                      </>
                    )}
                  </div>

                  {importStatus && (
                    <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg mb-2 border ${
                      importStatus.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      <span>{importStatus.msg}</span>
                      <button type="button" onClick={() => setImportStatus(null)} className="ml-2 hover:opacity-70">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto pr-0.5">
                      {selectedUsers.map(u => (
                        <span key={u.id} className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full">
                          <span className="max-w-[140px] truncate">{u.email}</span>
                          <button type="button" onClick={() => removeUser(u.id)} className="hover:text-teal-900 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {(target === 'selective' || selectedUsers.length === 0) && (
                    <div className="relative" ref={searchRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          placeholder="Search by email or name…"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      {(userResults.length > 0 || searchLoading) && (
                        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                          {searchLoading ? (
                            <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>
                          ) : userResults.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => addUser(u)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <span className="font-medium text-gray-800">{u.full_name}</span>
                              <span className="text-gray-400 ml-1.5 text-xs">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Notification title…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Write your message…"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{message.length}/2000</p>
              </div>

              {sendError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {sendError}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-teal-200"
              >
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Notification</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT: History ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">History</p>
                <p className="text-xs text-gray-400">{total} notification{total !== 1 ? 's' : ''} sent</p>
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Bell className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm">No notifications sent yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const tc = TYPE_CONFIG[n.type] ?? DEFAULT_TYPE;
                  const tg = TARGET_CONFIG[n.target] ?? DEFAULT_TARGET;
                  const isExpanded = expandedId === n.id;
                  return (
                    <div
                      key={n.id}
                      className="px-6 py-4 hover:bg-gray-50/60 transition-colors group cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : n.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type dot */}
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${tc.dot}`} />

                        <div className="flex-1 min-w-0">
                          {/* Badges + time */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${tc.color}`}>
                              {tc.icon}
                              {tc.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {tg.icon}
                              {tg.label}
                              {n.target !== 'all' && n.user_ids.length > 0 && ` · ${n.user_ids.length}`}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">{timeAgo(n.created_at)}</span>
                          </div>

                          {/* Title */}
                          <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>

                          {/* Message — truncated unless expanded */}
                          <p className={`text-xs text-gray-500 mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {n.message}
                          </p>

                          {isExpanded && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                              <span>By <span className="font-medium">{n.created_by}</span></span>
                              <span>{n.read_count} read</span>
                              <span>{fmtFull(n.created_at)}</span>
                            </p>
                          )}

                          {!isExpanded && (
                            <p className="text-xs text-gray-400 mt-1">
                              By {n.created_by} · {n.read_count} read
                            </p>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
