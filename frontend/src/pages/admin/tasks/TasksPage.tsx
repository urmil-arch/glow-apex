import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle, Clock, ExternalLink, Loader2,
  Plus, RefreshCw, X, ClipboardList, TriangleAlert, Undo2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

type TaskType     = 'failed_order' | 'refund_request' | 'manual';
type TaskStatus   = 'open' | 'in_progress' | 'resolved';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  description: string;
  notes: string;
  order_id: string | null;
  user_id: string | null;
  user_email: string | null;
  user_username: string | null;
  order_link: string | null;
  service_name: string | null;
  category_name: string | null;
  quantity: number | null;
  charge: number | null;
  currency: string;
  seen_by_admin: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const toUtc = (d: string) => d && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;

const fmtDate = (d: string) =>
  new Date(toUtc(d)).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TYPE_META: Record<TaskType, { label: string; cls: string; icon: React.ReactNode }> = {
  failed_order:    { label: 'Failed Order',    cls: 'bg-red-100 text-red-700',      icon: <TriangleAlert className="w-3 h-3" /> },
  refund_request:  { label: 'Refund Request',  cls: 'bg-amber-100 text-amber-700',  icon: <Undo2 className="w-3 h-3" /> },
  manual:          { label: 'Manual Task',     cls: 'bg-gray-100 text-gray-600',    icon: <ClipboardList className="w-3 h-3" /> },
};

const STATUS_META: Record<TaskStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  open:        { label: 'Open',        cls: 'bg-blue-100 text-blue-700',    icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', cls: 'bg-purple-100 text-purple-700', icon: <RefreshCw className="w-3 h-3" /> },
  resolved:    { label: 'Resolved',    cls: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3 h-3" /> },
};

const PRIORITY_CLS: Record<TaskPriority, string> = {
  high:   'bg-red-50 text-red-600 border border-red-200',
  medium: 'bg-amber-50 text-amber-600 border border-amber-200',
  low:    'bg-gray-50 text-gray-500 border border-gray-200',
};

const PAGE_SIZE = 30;

// ── Add Task Modal ─────────────────────────────────────────────────────────────

interface AddTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
}

function AddTaskModal({ onClose, onCreated }: AddTaskModalProps) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState<TaskPriority>('medium');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<Task>(API_ENDPOINTS.ADMIN_TASKS, {
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      onCreated(res.data);
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Add Manual Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Detail / Resolve Panel ────────────────────────────────────────────────

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

function TaskDetailPanel({ task, onClose, onUpdated }: TaskDetailPanelProps) {
  const [notes, setNotes]     = useState(task.notes);
  const [status, setStatus]   = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const res = await api.patch<Task>(`${API_ENDPOINTS.ADMIN_TASKS}/${task.id}`, {
        status,
        priority,
        notes,
      });
      onUpdated(res.data);
    } catch {
      setError('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  }

  const typeMeta   = TYPE_META[task.type];
  const statusMeta = STATUS_META[status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${typeMeta.cls}`}>
            {typeMeta.icon}{typeMeta.label}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title + description */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h3>
            {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
          </div>

          {/* Order / user info for auto-created tasks */}
          {task.order_id && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
              <p className="font-medium text-gray-700 mb-1">Order Info</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-gray-700">#{task.order_id.slice(-8)}</span>
              </div>
              {task.user_email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">User</span>
                  <span className="text-gray-700">{task.user_username} ({task.user_email})</span>
                </div>
              )}
              {task.category_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-700">{task.category_name}</span>
                </div>
              )}
              {task.quantity != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity</span>
                  <span className="text-gray-700">{task.quantity.toLocaleString()}</span>
                </div>
              )}
              {task.charge != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Charge</span>
                  <span className="font-semibold text-gray-900">${task.charge.toFixed(4)} {task.currency}</span>
                </div>
              )}
              {task.order_link && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Link</span>
                  <a
                    href={task.order_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:underline inline-flex items-center gap-1 max-w-[200px] truncate"
                  >
                    {task.order_link} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add resolution notes, contact info, refund reference..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-4">
            <span>Created {fmtDate(task.created_at)}</span>
            {task.resolved_at && <span className="text-green-600">Resolved {fmtDate(task.resolved_at)}</span>}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
                status === 'resolved'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <>
                  {statusMeta.icon}
                  {' '}Save — {statusMeta.label}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'failed_order' | 'refund_request' | 'manual';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',           label: 'All Tasks'       },
  { key: 'failed_order',  label: 'Failed Orders'   },
  { key: 'refund_request',label: 'Refund Requests' },
  { key: 'manual',        label: 'Manual'          },
];

const TasksPage = () => {
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [selected, setSelected]   = useState<Task | null>(null);
  const fetchRef = useRef(0);

  const fetchTasks = useCallback(async (tab: TabKey, pg: number) => {
    const token = ++fetchRef.current;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page: pg, page_size: PAGE_SIZE };
      if (tab !== 'all') params.type = tab;
      const res = await api.get<{ tasks: Task[]; total: number }>(API_ENDPOINTS.ADMIN_TASKS, { params });
      if (fetchRef.current !== token) return;
      setTasks(res.data.tasks ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      if (fetchRef.current !== token) return;
      setError('Failed to load tasks.');
    } finally {
      if (fetchRef.current === token) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(activeTab, page); }, [fetchTasks, activeTab, page]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [task, ...prev]);
    setTotal(prev => prev + 1);
    setShowAdd(false);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelected(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Count open tasks per type for tab badges
  const openCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.status !== 'resolved') acc[t.type] = (acc[t.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)} onCreated={handleTaskCreated} />
      )}
      {selected && (
        <TaskDetailPanel
          task={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleTaskUpdated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Failed orders, refund requests, and manual to-dos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks(activeTab, page)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(tab => {
          const count = tab.key !== 'all' ? (openCounts[tab.key] ?? 0) : 0;
          return (
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
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
            <CheckCircle className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No tasks here</p>
            <p className="text-xs text-gray-400">Failed orders and refund requests will appear automatically.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Task</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => {
                    const typeMeta   = TYPE_META[task.type];
                    const statusMeta = STATUS_META[task.status];
                    const isResolved = task.status === 'resolved';
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-gray-50 transition-colors ${isResolved ? 'opacity-60' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeMeta.cls}`}>
                            {typeMeta.icon}{typeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-xs font-medium text-gray-800 truncate leading-snug">{task.title}</p>
                          {task.order_id && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">#{task.order_id.slice(-8)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {task.user_username ? (
                            <>
                              <p className="text-xs font-medium text-gray-700">{task.user_username}</p>
                              <p className="text-xs text-gray-400">{task.user_email}</p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_CLS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.cls}`}>
                            {statusMeta.icon}{statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                          {fmtDate(task.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelected(task)}
                            className="text-xs font-medium text-teal-600 hover:text-teal-700"
                          >
                            {isResolved ? 'View' : 'Manage'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{total} task{total !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >«</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-2.5 py-1 text-xs rounded border ${
                          page === p ? 'bg-teal-600 text-white border-teal-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >{p}</button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                  >»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
