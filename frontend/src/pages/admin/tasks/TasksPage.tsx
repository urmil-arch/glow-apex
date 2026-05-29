import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Loader2, ListTodo, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  user_email: string;
  user_username: string;
  service_name: string;
  quantity: number;
  charge: number;
  status: string;
  provider_order_id: string;
  currency: string;
  created_at: string;
}

interface TaskListResponse {
  orders: Task[];
  total: number;
  page: number;
  page_size: number;
}

type TabKey = 'all' | 'manual' | 'pending' | 'processing' | 'success' | 'rejected' | 'error';

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const TABS: { key: TabKey; label: string; filter?: string }[] = [
  { key: 'all',        label: 'All Tasks'  },
  { key: 'manual',     label: 'Manual',     filter: 'manual'      },
  { key: 'pending',    label: 'Pending',    filter: 'Pending'     },
  { key: 'processing', label: 'Processing', filter: 'Processing'  },
  { key: 'success',    label: 'Success',    filter: 'Completed'   },
  { key: 'rejected',   label: 'Rejected',   filter: 'Cancelled'   },
  { key: 'error',      label: 'Error',      filter: 'Failed'      },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const statusCls = (s: string): string => {
  const l = s.toLowerCase();
  if (l === 'completed') return 'bg-green-100 text-green-700';
  if (l === 'pending')   return 'bg-yellow-100 text-yellow-700';
  if (l === 'processing' || l === 'in progress') return 'bg-blue-100 text-blue-700';
  if (l === 'cancelled' || l === 'refunded') return 'bg-orange-100 text-orange-700';
  if (l === 'failed')    return 'bg-red-100 text-red-700';
  if (l === 'partial')   return 'bg-purple-100 text-purple-700';
  if (l === 'manual')    return 'bg-teal-100 text-teal-700';
  return 'bg-gray-100 text-gray-600';
};

const fmt = (d: string) =>
  new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Page ───────────────────────────────────────────────────────────────────────

const TasksPage = () => {
  const [activeTab, setActiveTab]   = useState<TabKey>('all');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [errorCount, setErrorCount] = useState(0);

  const tabFilter = TABS.find(t => t.key === activeTab)?.filter;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (tabFilter) params.status_filter = tabFilter;
      if (search)    params.search        = search;
      const res = await api.get<TaskListResponse>(API_ENDPOINTS.ADMIN_ORDERS, { params });
      setTasks(res.data.orders ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  const fetchErrorCount = useCallback(async () => {
    try {
      const res = await api.get<TaskListResponse>(API_ENDPOINTS.ADMIN_ORDERS, {
        params: { status_filter: 'Failed', page: 1, page_size: 1 },
      });
      setErrorCount(res.data.total ?? 0);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchTasks(); },     [fetchTasks]);
  useEffect(() => { fetchErrorCount(); }, [fetchErrorCount]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Track all SMM order tasks and their status.</p>
        </div>
        <button
          onClick={() => { fetchTasks(); fetchErrorCount(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.key === 'error' && errorCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              }`}>
                {errorCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by Order ID…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
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
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
            <ListTodo className="w-10 h-10 text-gray-300" />
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Qty</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Charge</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Provider ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{task.id.slice(-10)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-800 font-medium text-xs">{task.user_username}</p>
                        <p className="text-gray-400 text-xs">{task.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell max-w-[160px] truncate">{task.service_name}</td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{task.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">
                        {task.charge.toFixed(4)} {task.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden xl:table-cell">
                        {task.provider_order_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                        {fmt(task.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {total} task{total !== 1 ? 's' : ''} total
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
    </div>
  );
};

export default TasksPage;
