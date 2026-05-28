import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, Download, Search, MoreVertical,
  Edit2, KeyRound, Clock, Ban, CheckCircle, ShieldCheck,
  X, Eye, EyeOff, ChevronLeft, ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface AdminUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  is_verified: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  personal_discount: number;
  created_at: string;
}

interface Stats {
  total: number;
  verified: number;
  suspended: number;
}

interface SignInLog {
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

interface AddForm {
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
}

interface EditForm {
  full_name: string;
  username: string;
  personal_discount: string;
}

const PAGE_SIZE = 20;

const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, suspended: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [menuState, setMenuState] = useState<{ id: string; top: number; right: number } | null>(null);

  const [addForm, setAddForm] = useState<AddForm>({
    full_name: '', username: '', email: '', password: '', is_admin: false,
  });
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '', username: '', personal_discount: '0',
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInLogs, setSignInLogs] = useState<SignInLog[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN_USERS, {
        params: { page, page_size: PAGE_SIZE, search, filter_by: filterBy },
      });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      // keep previous state
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterBy]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN_USERS_STATS);
      setStats(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleFilterChange = (f: string) => { setFilterBy(f); setPage(1); };

  const toCSV = (rows: AdminUser[], emailsOnly = false): string => {
    if (emailsOnly) return ['email', ...rows.map((u) => u.email)].join('\n');
    const headers = ['id', 'full_name', 'username', 'email', 'verified', 'admin', 'suspended', 'discount', 'created_at'];
    const lines = rows.map((u) =>
      [u.id, u.full_name, u.username, u.email, u.is_verified, u.is_admin, u.is_suspended, u.personal_discount, u.created_at].join(',')
    );
    return [headers.join(','), ...lines].join('\n');
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (emailsOnly: boolean) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.ADMIN_USERS_EXPORT);
      triggerDownload(toCSV(data, emailsOnly), emailsOnly ? 'emails.csv' : 'users.csv');
    } catch { /* silent */ }
  };

  const handleAddUser = async () => {
    setModalLoading(true); setModalError('');
    try {
      await api.post(API_ENDPOINTS.ADMIN_USERS, { ...addForm, personal_discount: 0 });
      setAddModal(false);
      setAddForm({ full_name: '', username: '', email: '', password: '', is_admin: false });
      fetchUsers(); fetchStats();
    } catch (err: unknown) {
      setModalError(axios.isAxiosError(err) ? (err.response?.data?.detail ?? 'Failed to create user') : 'Failed to create user');
    } finally { setModalLoading(false); }
  };

  const openEdit = (user: AdminUser) => {
    setEditTarget(user);
    setEditForm({ full_name: user.full_name, username: user.username, personal_discount: String(user.personal_discount) });
    setModalError('');
  };

  const handleEditUser = async () => {
    if (!editTarget) return;
    setModalLoading(true); setModalError('');
    try {
      await api.patch(`${API_ENDPOINTS.ADMIN_USERS}/${editTarget.id}`, {
        full_name: editForm.full_name, username: editForm.username,
        personal_discount: parseFloat(editForm.personal_discount) || 0,
      });
      setEditTarget(null); fetchUsers();
    } catch (err: unknown) {
      setModalError(axios.isAxiosError(err) ? (err.response?.data?.detail ?? 'Failed to update user') : 'Failed to update user');
    } finally { setModalLoading(false); }
  };

  const handleSetPassword = async () => {
    if (!passwordTarget) return;
    setModalLoading(true); setModalError('');
    try {
      await api.post(`${API_ENDPOINTS.ADMIN_USERS}/${passwordTarget.id}/set-password`, { new_password: newPassword });
      setPasswordTarget(null); setNewPassword('');
    } catch (err: unknown) {
      setModalError(axios.isAxiosError(err) ? (err.response?.data?.detail ?? 'Failed to set password') : 'Failed to set password');
    } finally { setModalLoading(false); }
  };

  const openHistory = async (user: AdminUser) => {
    setHistoryTarget(user); setSignInLogs([]);
    try {
      const { data } = await api.get(`${API_ENDPOINTS.ADMIN_USERS}/${user.id}/sign-in-history`);
      setSignInLogs(data);
    } catch { /* show empty */ }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setModalLoading(true);
    try {
      await api.post(`${API_ENDPOINTS.ADMIN_USERS}/${suspendTarget.id}/suspend`, { suspended: !suspendTarget.is_suspended });
      setSuspendTarget(null); fetchUsers(); fetchStats();
    } catch { /* silent */ } finally { setModalLoading(false); }
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const FILTERS = ['all', 'verified', 'unverified', 'suspended'] as const;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport(true)} className={outlineBtnCls}>
            <Download className="h-4 w-4" /> Export Emails
          </button>
          <button onClick={() => handleExport(false)} className={outlineBtnCls}>
            <Download className="h-4 w-4" /> Export Users
          </button>
          <button onClick={() => { setAddModal(true); setModalError(''); }} className={primaryBtnCls}>
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: stats.total, icon: <Users className="h-5 w-5 text-teal-600" />, bg: 'bg-teal-50' },
          { label: 'Active', value: stats.verified, icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Suspended', value: stats.suspended, icon: <Ban className="h-5 w-5 text-red-500" />, bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, username, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <button onClick={handleSearch} className={primaryBtnCls}>Search</button>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors border ${
                filterBy === f
                  ? 'bg-teal-50 text-teal-700 border-teal-200 font-medium'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Discount</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900 font-medium">{user.full_name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">@{user.username}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.is_suspended ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100">Suspended</span>
                      ) : user.is_verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">Unverified</span>
                      )}
                      {user.is_admin && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-100 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.personal_discount > 0 ? `${user.personal_discount}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setMenuState(
                          menuState?.id === user.id
                            ? null
                            : { id: user.id, top: rect.bottom + 4, right: window.innerWidth - rect.right }
                        );
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-gray-400 text-sm">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {menuState && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuState(null)} />
          <div
            className="fixed z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
            style={{ top: menuState.top, right: menuState.right }}
          >
            {users.filter((u) => u.id === menuState.id).map((user) => (
              <div key={user.id}>
                <ActionItem icon={<Edit2 className="h-4 w-4" />} label="Edit User" onClick={() => { openEdit(user); setMenuState(null); }} />
                <ActionItem icon={<KeyRound className="h-4 w-4" />} label="Set Password" onClick={() => { setPasswordTarget(user); setModalError(''); setMenuState(null); }} />
                <ActionItem icon={<Clock className="h-4 w-4" />} label="Sign-in History" onClick={() => { openHistory(user); setMenuState(null); }} />
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setSuspendTarget(user); setMenuState(null); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${user.is_suspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                >
                  <Ban className="h-4 w-4" />
                  {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Add User Modal ── */}
      {addModal && (
        <Modal title="Add User" onClose={() => setAddModal(false)}>
          <div className="space-y-4">
            <Field label="Full Name"><input type="text" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} className={inputCls} /></Field>
            <Field label="Username"><input type="text" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} className={inputCls} /></Field>
            <Field label="Email"><input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Password">
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={addForm.is_admin} onChange={(e) => setAddForm({ ...addForm, is_admin: e.target.checked })} className="rounded border-gray-300 text-teal-600" />
              Grant admin access
            </label>
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddModal(false)} className={cancelCls}>Cancel</button>
              <button onClick={handleAddUser} disabled={modalLoading} className={primaryCls}>{modalLoading ? 'Creating…' : 'Create User'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit User Modal ── */}
      {editTarget && (
        <Modal title="Edit User" onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <Field label="Full Name"><input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className={inputCls} /></Field>
            <Field label="Username"><input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className={inputCls} /></Field>
            <Field label="Personal Discount (%)"><input type="number" min="0" max="100" value={editForm.personal_discount} onChange={(e) => setEditForm({ ...editForm, personal_discount: e.target.value })} className={inputCls} /></Field>
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditTarget(null)} className={cancelCls}>Cancel</button>
              <button onClick={handleEditUser} disabled={modalLoading} className={primaryCls}>{modalLoading ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Set Password Modal ── */}
      {passwordTarget && (
        <Modal title={`Set Password — ${passwordTarget.username}`} onClose={() => setPasswordTarget(null)}>
          <div className="space-y-4">
            <Field label="New Password">
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls + ' pr-10'} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {modalError && <p className="text-red-500 text-sm">{modalError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPasswordTarget(null)} className={cancelCls}>Cancel</button>
              <button onClick={handleSetPassword} disabled={modalLoading} className={primaryCls}>{modalLoading ? 'Setting…' : 'Set Password'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Sign-in History Modal ── */}
      {historyTarget && (
        <Modal title={`Sign-in History — ${historyTarget.username}`} onClose={() => setHistoryTarget(null)}>
          {signInLogs.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No sign-in records found.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {signInLogs.map((log, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-teal-600 font-mono font-medium">{log.ip_address}</span>
                    <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{log.user_agent || '—'}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button onClick={() => setHistoryTarget(null)} className={cancelCls}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Suspend Confirm Modal ── */}
      {suspendTarget && (
        <Modal title={suspendTarget.is_suspended ? 'Unsuspend User' : 'Suspend User'} onClose={() => setSuspendTarget(null)}>
          <p className="text-gray-600 text-sm mb-6">
            {suspendTarget.is_suspended
              ? `Restore access for ${suspendTarget.full_name}?`
              : `Suspend ${suspendTarget.full_name}? They will not be able to sign in.`}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setSuspendTarget(null)} className={cancelCls}>Cancel</button>
            <button
              onClick={handleSuspend}
              disabled={modalLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${suspendTarget.is_suspended ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            >
              {modalLoading ? 'Processing…' : suspendTarget.is_suspended ? 'Unsuspend' : 'Suspend'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Shared components ──────────────────────────────

const ActionItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
    {icon} {label}
  </button>
);

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
    <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-gray-900 font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
    {children}
  </div>
);

// ── Shared class strings ──────────────────────────────
const inputCls = 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500';
const primaryCls = 'px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white text-sm font-medium transition-colors';
const cancelCls = 'px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors';
const primaryBtnCls = 'flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors';
const outlineBtnCls = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm transition-colors';

export default UsersPage;
