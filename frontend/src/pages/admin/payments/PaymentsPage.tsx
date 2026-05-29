import { useEffect, useState, useCallback } from 'react';
import {
  Search, Download, Plus, Trash2, Loader2,
  CreditCard, AlertCircle, X, Check,
} from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  display_id: number;
  user_id: string;
  user_email: string;
  user_username: string;
  user_balance: number;
  amount: number;
  method: string;
  type: 'credit' | 'debit';
  status: string;
  memo: string;
  created_at: string;
}

interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  page_size: number;
}

interface UserOption {
  id: string;
  username: string;
  email: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const BASE_ID = 100000;

const METHOD_OPTIONS = ['All', 'Manual', 'Stripe', 'Cashfree', 'Cryptomus', 'Payeer'];
const STATUS_OPTIONS = ['All', 'Completed', 'Pending', 'Failed'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const statusCls = (s: string): string => {
  const l = s.toLowerCase();
  if (l === 'completed') return 'bg-green-100 text-green-700';
  if (l === 'pending')   return 'bg-yellow-100 text-yellow-700';
  if (l === 'failed')    return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

const methodCls = (m: string): string => {
  const l = m.toLowerCase();
  if (l === 'manual')    return 'bg-teal-100 text-teal-700';
  if (l === 'stripe')    return 'bg-indigo-100 text-indigo-700';
  if (l === 'cashfree')  return 'bg-blue-100 text-blue-700';
  if (l === 'cryptomus') return 'bg-orange-100 text-orange-700';
  if (l === 'payeer')    return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-600';
};

const fmt = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

// ── Add Payment Modal ──────────────────────────────────────────────────────────

interface AddPaymentModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const AddPaymentModal = ({ onClose, onSaved }: AddPaymentModalProps) => {
  const [form, setForm] = useState({
    user_search: '',
    user_id: '',
    user_label: '',
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    memo: '',
    status: 'Completed',
  });
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); return; }
    try {
      const res = await api.get<{ users: UserOption[] }>(API_ENDPOINTS.ADMIN_USERS, {
        params: { search: q, page_size: 8 },
      });
      setUsers(res.data.users ?? []);
      setShowDropdown(true);
    } catch { /* silent */ }
  }, []);

  const handleUserInput = (val: string) => {
    setForm(f => ({ ...f, user_search: val, user_id: '', user_label: '' }));
    searchUsers(val);
  };

  const selectUser = (u: UserOption) => {
    setForm(f => ({ ...f, user_id: u.id, user_label: `${u.username} (${u.email})`, user_search: `${u.username} (${u.email})` }));
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id) { setError('Please select a user.'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post(API_ENDPOINTS.ADMIN_PAYMENTS, {
        user_id: form.user_id,
        amount: Number(form.amount),
        method: 'Manual',
        type: form.type,
        memo: form.memo.trim(),
        status: form.status,
      });
      onSaved();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? 'Failed to add payment.');
      } else {
        setError('Failed to add payment.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* User search */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
            <input
              value={form.user_search}
              onChange={e => handleUserInput(e.target.value)}
              onFocus={() => form.user_search && setShowDropdown(true)}
              placeholder="Search by username or email…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            {showDropdown && users.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <div className="flex gap-2">
              {(['credit', 'debit'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                    form.type === t
                      ? t === 'credit'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-red-500 text-white border-red-500'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Memo</label>
            <input
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="Optional note…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const AdminPaymentsPage = () => {
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd]         = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (search)                    params.search         = search;
      if (methodFilter !== 'All')    params.method_filter  = methodFilter.toLowerCase();
      if (statusFilter !== 'All')    params.status_filter  = statusFilter;
      const res = await api.get<PaymentListResponse>(API_ENDPOINTS.ADMIN_PAYMENTS, { params });
      setPayments(res.data.payments ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [page, search, methodFilter, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleExport = () => {
    if (payments.length === 0) return;
    const headers = 'ID,User,Email,Balance,Amount,Method,Type,Status,Memo,Created';
    const rows = payments.map((p, i) =>
      [
        BASE_ID + (page - 1) * PAGE_SIZE + i + 1,
        p.user_username,
        p.user_email,
        p.user_balance.toFixed(2),
        p.amount.toFixed(2),
        p.method,
        p.type,
        p.status,
        `"${p.memo.replace(/"/g, '""')}"`,
        p.created_at,
      ].join(',')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment record? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`${API_ENDPOINTS.ADMIN_PAYMENTS}/${id}`);
      fetchPayments();
    } catch {
      alert('Failed to delete payment.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">All payment transactions across the platform.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={handleExport}
          disabled={payments.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>

        {/* Filters */}
        <select
          value={methodFilter}
          onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {METHOD_OPTIONS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search user or ID…"
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 text-red-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
            <CreditCard className="w-10 h-10 text-gray-300" />
            <p className="text-sm">No payments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Balance</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Method</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Memo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => {
                    const displayId = BASE_ID + (page - 1) * PAGE_SIZE + i + 1;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{displayId}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-xs">{p.user_username}</p>
                          <p className="text-gray-400 text-xs hidden sm:block">{p.user_email}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 hidden md:table-cell">
                          ${p.user_balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm">
                          <span className={p.type === 'credit' ? 'text-green-600' : 'text-red-500'}>
                            {p.type === 'credit' ? '+' : '-'}{p.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodCls(p.method)}`}>
                            {p.method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell max-w-[180px] truncate">
                          {p.memo || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                          {fmt(p.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {deleting === p.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {total} payment{total !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  «
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        page === p
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <AddPaymentModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchPayments(); }}
        />
      )}
    </div>
  );
};

export default AdminPaymentsPage;
