import { useEffect, useRef, useState } from 'react';
import { UserCog, ShieldCheck, RefreshCw, AlertCircle, Pencil, X, Check, Loader } from 'lucide-react';
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
  created_at: string;
}

interface StaffListResponse {
  users: StaffMember[];
  total: number;
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
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Edit modal ─────────────────────────────────────────────────────────────────

interface EditModalProps {
  member: StaffMember;
  onClose: () => void;
  onSaved: (updated: StaffMember) => void;
}

function EditModal({ member, onClose, onSaved }: EditModalProps) {
  const [role, setRole] = useState(member.role);
  const [perms, setPerms] = useState<Set<string>>(new Set(member.extra_permissions));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const togglePerm = (p: string) =>
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.patch(`${API_ENDPOINTS.ADMIN_USERS}/${member.id}/role`, {
        role,
        extra_permissions: [...perms].sort(),
      });
      onSaved({ ...member, role, extra_permissions: [...perms].sort(), is_admin: role === 'admin' });
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(typeof detail === 'string' ? detail : 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Edit Permissions</p>
            <p className="text-xs text-gray-400 mt-0.5">{member.full_name} · {member.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {ALL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Default permissions for selected role */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Default permissions for this role
            </p>
            {role === 'admin' || role === 'operations_manager' ? (
              <p className="text-xs text-gray-500 italic">All permissions granted by default</p>
            ) : (ROLE_DEFAULT_PERMISSIONS[role] ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">None</p>
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

          {/* Extra permissions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Extra Permissions
              <span className="ml-1 font-normal normal-case text-gray-400">(added on top of role defaults)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((p) => {
                const isDefault = (ROLE_DEFAULT_PERMISSIONS[role] ?? []).includes(p);
                return (
                  <label
                    key={p}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                      isDefault
                        ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-100 hover:border-teal-200 hover:bg-teal-50/40 cursor-pointer'
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
                    {isDefault && (
                      <span className="ml-auto text-[10px] text-gray-400 font-medium">default</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<StaffListResponse>(API_ENDPOINTS.ADMIN_USERS, {
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

  const handleSaved = (updated: StaffMember) =>
    setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

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
                      {member.is_admin && (
                        <ShieldCheck className="w-4 h-4 text-violet-500 flex-shrink-0" title="Full Administrator" />
                      )}
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

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    {member.id !== currentUser?.id && (
                      <button
                        onClick={() => setEditing(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-teal-700 border border-gray-200 hover:border-teal-300 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
