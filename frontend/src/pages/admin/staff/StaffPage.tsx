import { useEffect, useRef, useState } from 'react';
import {
  UserCog, ShieldCheck, RefreshCw, AlertCircle, Pencil, X, Check,
  Loader, MoreVertical, KeyRound, Clock, Ban, Edit2, Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';
import { useAuth } from '@/context/AuthContext';

interface StaffMember {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  extra_permissions: string[];
  is_admin: boolean;
  is_suspended: boolean;
  is_verified: boolean;
  created_at: string;
}

interface SignInLog {
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  operations_manager: 'Operations Manager',
  support: 'Support',
  accounts_manager: 'Accounts Manager',
  seo_manager: 'SEO Manager',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700',
  operations_manager: 'bg-blue-100 text-blue-700',
  support: 'bg-teal-100 text-teal-700',
  accounts_manager: 'bg-orange-100 text-orange-700',
  seo_manager: 'bg-pink-100 text-pink-700',
};

const ALL_PERMISSIONS = [
  'dashboard', 'users', 'orders', 'tasks', 'payments',
  'services', 'routing', 'support', 'pricing', 'blogs', 'settings',
];

const ALL_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'support', label: 'Support' },
  { value: 'accounts_manager', label: 'Accounts Manager' },
  { value: 'seo_manager', label: 'SEO Manager' },
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,
  operations_manager: ALL_PERMISSIONS,
  support: ['orders', 'payments', 'support'],
  accounts_manager: ['dashboard', 'orders', 'payments'],
  seo_manager: ['blogs'],
};

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

const toUtc = (d: string) => d && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;
const fmtDate = (iso: string) =>
  iso ? new Date(toUtc(iso)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (iso: string) =>
  iso ? new Date(toUtc(iso)).toLocaleString('en-IN') : '—';

// ── Shared modal shell ─────────────────────────────────────────────────────────

function Modal({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Change Role modal ──────────────────────────────────────────────────────────

function RoleModal({ member, onClose, onSaved }: { member: StaffMember; onClose: () => void; onSaved: (m: StaffMember) => void }) {
  const [role, setRole] = useState(member.role);
  const [perms, setPerms] = useState<Set<string>>(new Set(member.extra_permissions));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePerm = (p: string) =>
    setPerms((prev) => { const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next; });

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}/role`, {
        role, extra_permissions: [...perms].sort(),
      });
      onSaved({ ...member, role, extra_permissions: [...perms].sort(), is_admin: role === 'admin' });
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update permissions.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Change Role" sub={`${member.full_name} · ${member.email}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {ALL_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Default permissions for this role</p>
          {role === 'admin' || role === 'operations_manager' ? (
            <p className="text-xs text-gray-500 italic">All permissions granted by default</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(ROLE_DEFAULT_PERMISSIONS[role] ?? []).map((p) => (
                <span key={p} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 rounded text-xs capitalize">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Extra Permissions <span className="font-normal normal-case text-gray-400">(added on top of role defaults)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map((p) => {
              const isDefault = (ROLE_DEFAULT_PERMISSIONS[role] ?? []).includes(p);
              return (
                <label
                  key={p}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                    isDefault ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60' : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/40 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDefault || perms.has(p)}
                    onChange={() => { if (!isDefault) togglePerm(p); }}
                    disabled={isDefault}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">{p.replace(/_/g, ' ')}</span>
                  {isDefault && <span className="ml-auto text-[10px] text-gray-400 font-medium">default</span>}
                </label>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Details modal ─────────────────────────────────────────────────────────

function EditDetailsModal({ member, onClose, onSaved }: { member: StaffMember; onClose: () => void; onSaved: (m: StaffMember) => void }) {
  const [fullName, setFullName] = useState(member.full_name);
  const [username, setUsername] = useState(member.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.patch(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}`, { full_name: fullName, username });
      onSaved({ ...member, full_name: fullName, username });
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update details.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Edit Details" sub={member.email} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

// ── Set Password modal ─────────────────────────────────────────────────────────

function SetPasswordModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.post(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}/set-password`, { new_password: password });
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to set password.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Set Password" sub={`${member.username} · ${member.email}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving || password.length < 6}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Setting…' : 'Set Password'}
        </button>
      </div>
    </Modal>
  );
}

// ── Sign-in History modal ──────────────────────────────────────────────────────

function SignInHistoryModal({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [logs, setLogs] = useState<SignInLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}/sign-in-history`)
      .then((res) => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [member.id]);

  return (
    <Modal title="Sign-in History" sub={`${member.username} · ${member.email}`} onClose={onClose}>
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No sign-in records found.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {logs.map((log, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-teal-600 font-mono font-medium">{log.ip_address}</span>
                  <span className="text-gray-400 text-xs">{fmtDateTime(log.timestamp)}</span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5 truncate">{log.user_agent || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Close</button>
      </div>
    </Modal>
  );
}

// ── Suspend Confirm modal ──────────────────────────────────────────────────────

function SuspendModal({ member, onClose, onDone }: { member: StaffMember; onClose: () => void; onDone: (m: StaffMember) => void }) {
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await api.post(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}/suspend`, { suspended: !member.is_suspended });
      onDone({ ...member, is_suspended: !member.is_suspended });
      onClose();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  return (
    <Modal
      title={member.is_suspended ? 'Unsuspend Staff Member' : 'Suspend Staff Member'}
      sub={member.full_name}
      onClose={onClose}
    >
      <div className="px-6 py-5">
        <p className="text-gray-600 text-sm">
          {member.is_suspended
            ? `Restore access for ${member.full_name}? They will be able to sign in again.`
            : `Suspend ${member.full_name}? They will not be able to sign in until unsuspended.`}
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button
          onClick={handle}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${
            member.is_suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          {saving ? 'Processing…' : member.is_suspended ? 'Unsuspend' : 'Suspend'}
        </button>
      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type ActiveModal =
  | { type: 'role'; member: StaffMember }
  | { type: 'edit'; member: StaffMember }
  | { type: 'password'; member: StaffMember }
  | { type: 'history'; member: StaffMember }
  | { type: 'suspend'; member: StaffMember };

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ActiveModal | null>(null);
  const [menuState, setMenuState] = useState<{ id: string; top: number; right: number } | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(API_ENDPOINTS.ADMIN_USERS, {
        params: { filter_by: 'staff', page_size: 100, page: 1 },
      });
      setStaff(res.data.users ?? []);
    } catch {
      setError('Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const updateMember = (updated: StaffMember) =>
    setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState(menuState?.id === id ? null : { id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-500 text-sm mt-1">All non-user accounts with admin panel access</p>
        </div>
        <button
          onClick={fetchStaff}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No staff accounts found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  {/* Member */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-700 font-bold text-xs">{initials(member.full_name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{member.full_name}</p>
                        <p className="text-gray-400 text-xs truncate">{member.email}</p>
                      </div>
                      {member.is_admin && <ShieldCheck className="w-4 h-4 text-violet-500 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </td>

                  {/* Permissions */}
                  <td className="px-5 py-4">
                    {member.is_admin ? (
                      <span className="text-xs text-gray-400 italic">All permissions</span>
                    ) : member.extra_permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.extra_permissions.map((p) => (
                          <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Role defaults</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    {member.is_suspended ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-gray-500 text-sm">{fmtDate(member.created_at)}</td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {member.id !== currentUser?.id && (
                      <button
                        onClick={(e) => openMenu(e, member.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Actions dropdown ── */}
      {menuState && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuState(null)} />
          <div
            className="fixed z-30 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
            style={{ top: menuState.top, right: menuState.right }}
          >
            {staff.filter((m) => m.id === menuState.id).map((member) => (
              <div key={member.id}>
                <MenuItem
                  icon={<Edit2 className="w-4 h-4" />}
                  label="Edit Details"
                  onClick={() => { setModal({ type: 'edit', member }); setMenuState(null); }}
                />
                <MenuItem
                  icon={<Pencil className="w-4 h-4" />}
                  label="Change Role"
                  onClick={() => { setModal({ type: 'role', member }); setMenuState(null); }}
                />
                <MenuItem
                  icon={<KeyRound className="w-4 h-4" />}
                  label="Set Password"
                  onClick={() => { setModal({ type: 'password', member }); setMenuState(null); }}
                />
                <MenuItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Sign-in History"
                  onClick={() => { setModal({ type: 'history', member }); setMenuState(null); }}
                />
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setModal({ type: 'suspend', member }); setMenuState(null); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                    member.is_suspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  {member.is_suspended ? 'Unsuspend' : 'Suspend'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {modal?.type === 'role' && (
        <RoleModal member={modal.member} onClose={() => setModal(null)} onSaved={(m) => { updateMember(m); setModal(null); }} />
      )}
      {modal?.type === 'edit' && (
        <EditDetailsModal member={modal.member} onClose={() => setModal(null)} onSaved={(m) => { updateMember(m); setModal(null); }} />
      )}
      {modal?.type === 'password' && (
        <SetPasswordModal member={modal.member} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'history' && (
        <SignInHistoryModal member={modal.member} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'suspend' && (
        <SuspendModal member={modal.member} onClose={() => setModal(null)} onDone={(m) => { updateMember(m); setModal(null); }} />
      )}
    </div>
  );
}

// ── Shared menu item ───────────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
    >
      {icon} {label}
    </button>
  );
}
