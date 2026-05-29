import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CreditCard,
  DollarSign,
  Edit2,
  EyeOff,
  Globe,
  Layers,
  Loader2,
  Mail,
  Plus,
  Server,
  ShieldAlert,
  Trash2,
  Type,
  Wallet,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ---- Types ----

interface PlatformSettings {
  site_name: string;
  support_email: string;
  currency: 'USD' | 'INR' | 'EUR';
  maintenance_mode: boolean;
  min_order_quantity: number;
  max_order_quantity: number;
  payment_stripe_enabled: boolean;
  payment_cashfree_enabled: boolean;
  payment_cryptomus_enabled: boolean;
  payment_payeer_enabled: boolean;
  notify_new_order: boolean;
  notify_new_ticket: boolean;
  social_twitter: string;
  social_instagram: string;
  social_youtube: string;
  social_facebook: string;
}

interface Provider {
  id: string;
  name: string;
  url: string;
  api_key: string;
  created_at: string;
}

// ---- Shared styles ----

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
const primaryCls =
  'flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const cancelCls =
  'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors';

// ---- Toggle row ----

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: 'teal' | 'amber';
}

const ToggleRow = ({ label, description, checked, onChange, accent = 'teal' }: ToggleRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? (accent === 'amber' ? 'bg-amber-500' : 'bg-teal-500') : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// ---- Modal ----

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ---- Provider form modal ----

interface ProviderModalProps {
  provider?: Provider;
  onClose: () => void;
  onSaved: (p: Provider) => void;
}

const ProviderModal = ({ provider, onClose, onSaved }: ProviderModalProps) => {
  const isEdit = Boolean(provider);
  const [form, setForm] = useState({
    name: provider?.name ?? '',
    url: provider?.url ?? '',
    api_key: provider?.api_key ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let res: { data: Provider };
      if (isEdit && provider) {
        res = await api.patch<Provider>(`${API_ENDPOINTS.ADMIN_PROVIDERS}/${provider.id}`, form);
      } else {
        res = await api.post<Provider>(API_ENDPOINTS.ADMIN_PROVIDERS, form);
      }
      onSaved(res.data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Provider' : 'Add Provider'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Provider Name</label>
          <input
            className={inputCls}
            placeholder="e.g. Postlikes"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">API URL</label>
          <input
            className={inputCls}
            placeholder="https://postlikes.com/api/v2"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            The endpoint that accepts <code className="text-gray-500">action</code> POST requests.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
          <input
            className={inputCls}
            type="password"
            placeholder="Your API key"
            value={form.api_key}
            onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Provider'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Provider card ----

interface ProviderCardProps {
  provider: Provider;
  onEdit: () => void;
  onDelete: () => void;
}

const ProviderCard = ({ provider, onEdit, onDelete }: ProviderCardProps) => {
  const [balance, setBalance] = useState<{ balance: string; currency: string } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  const fetchBalance = async () => {
    setLoadingBalance(true);
    setBalanceError('');
    try {
      const res = await api.get<{ balance: string; currency: string }>(
        `${API_ENDPOINTS.ADMIN_PROVIDERS}/${provider.id}/balance`
      );
      setBalance(res.data);
    } catch {
      setBalanceError('Failed to fetch balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50">
            <Server className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{provider.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-xs">{provider.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {balance ? (
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-900">
              {balance.balance} {balance.currency}
            </span>
            <button
              onClick={() => setBalance(null)}
              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide balance"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : balanceError ? (
          <span className="text-xs text-red-500">{balanceError}</span>
        ) : (
          <span className="text-xs text-gray-400">Balance not fetched</span>
        )}

        <button
          onClick={fetchBalance}
          disabled={loadingBalance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loadingBalance ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wallet className="h-3 w-3" />
          )}
          Check Balance
        </button>
      </div>
    </div>
  );
};

// ---- Delete confirm ----

interface DeleteConfirmProps {
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteConfirm = ({ label, onClose, onConfirm }: DeleteConfirmProps) => {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => { setDeleting(true); await onConfirm(); setDeleting(false); };
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-6">
        Delete <span className="font-medium text-gray-900">{label}</span>? This cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <button className={cancelCls} onClick={onClose}>Cancel</button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          onClick={handle}
          disabled={deleting}
        >
          {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
          Delete
        </button>
      </div>
    </Modal>
  );
};

// ---- Main page ----

const SettingsPage = () => {
  const [tab, setTab] = useState<'general' | 'providers'>('general');

  const [settings, setSettings] = useState<PlatformSettings>({
    site_name: '',
    support_email: '',
    currency: 'USD',
    maintenance_mode: false,
    min_order_quantity: 100,
    max_order_quantity: 100000,
    payment_stripe_enabled: true,
    payment_cashfree_enabled: true,
    payment_cryptomus_enabled: true,
    payment_payeer_enabled: true,
    notify_new_order: true,
    notify_new_ticket: true,
    social_twitter: '',
    social_instagram: '',
    social_youtube: '',
    social_facebook: '',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<Provider | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<PlatformSettings>(API_ENDPOINTS.ADMIN_SETTINGS);
        setSettings((prev) => ({ ...prev, ...res.data }));
      } finally {
        setLoadingSettings(false);
      }
    };
    const fetchProviders = async () => {
      try {
        const res = await api.get<Provider[]>(API_ENDPOINTS.ADMIN_PROVIDERS);
        setProviders(res.data);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchSettings();
    fetchProviders();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      const res = await api.patch<PlatformSettings>(API_ENDPOINTS.ADMIN_SETTINGS, settings);
      setSettings((prev) => ({ ...prev, ...res.data }));
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSettingsError(typeof detail === 'string' ? detail : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProviderSaved = (saved: Provider) => {
    setProviders((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved];
    });
    setShowAddProvider(false);
    setEditProvider(null);
  };

  const handleDeleteProvider = async () => {
    if (!deleteProvider) return;
    await api.delete(`${API_ENDPOINTS.ADMIN_PROVIDERS}/${deleteProvider.id}`);
    setProviders((prev) => prev.filter((p) => p.id !== deleteProvider.id));
    setDeleteProvider(null);
  };

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your platform and SMM providers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['general', 'providers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'general' ? 'General' : 'SMM Providers'}
          </button>
        ))}
      </div>

      {/* ---- General Tab ---- */}
      {tab === 'general' && (
        <div>
          {loadingSettings ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {settingsError && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{settingsError}</p>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

                {/* ---- Left column ---- */}
                <div className="space-y-5">

                  {/* Branding */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Type className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Branding</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Site Name</label>
                        <input
                          className={inputCls}
                          placeholder="Glow Apex"
                          value={settings.site_name}
                          onChange={(e) => set('site_name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Support Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            className={`${inputCls} pl-9`}
                            placeholder="support@glowapex.com"
                            value={settings.support_email}
                            onChange={(e) => set('support_email', e.target.value)}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Shown to customers on the contact page and emails.</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Payment Methods</h3>
                    </div>
                    <div className="space-y-4">
                      <ToggleRow
                        label="Stripe"
                        description="Credit / debit cards via Stripe Checkout"
                        checked={settings.payment_stripe_enabled}
                        onChange={(v) => set('payment_stripe_enabled', v)}
                      />
                      <ToggleRow
                        label="Cashfree"
                        description="UPI, net banking, cards (INR)"
                        checked={settings.payment_cashfree_enabled}
                        onChange={(v) => set('payment_cashfree_enabled', v)}
                      />
                      <ToggleRow
                        label="Cryptomus"
                        description="Cryptocurrency payments"
                        checked={settings.payment_cryptomus_enabled}
                        onChange={(v) => set('payment_cryptomus_enabled', v)}
                      />
                      <ToggleRow
                        label="Payeer"
                        description="Payeer wallet payments"
                        checked={settings.payment_payeer_enabled}
                        onChange={(v) => set('payment_payeer_enabled', v)}
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Social Links</h3>
                    </div>
                    <div className="space-y-3">
                      {(
                        [
                          { key: 'social_twitter', label: 'Twitter / X', placeholder: 'https://x.com/yourhandle' },
                          { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
                          { key: 'social_youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
                          { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                        ] as const
                      ).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                          <input
                            type="url"
                            className={inputCls}
                            placeholder={placeholder}
                            value={settings[key]}
                            onChange={(e) => set(key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ---- Right column ---- */}
                <div className="space-y-5">

                  {/* Currency */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Currency</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(['USD', 'INR', 'EUR'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set('currency', c)}
                          className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            settings.currency === c
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {c === 'USD' && '$ USD'}
                          {c === 'INR' && '₹ INR'}
                          {c === 'EUR' && '€ EUR'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Limits */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Order Limits</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Quantity</label>
                        <input
                          type="number"
                          min={1}
                          className={inputCls}
                          placeholder="100"
                          value={settings.min_order_quantity}
                          onChange={(e) => set('min_order_quantity', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-400 mt-1">Smallest order a customer can place.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Maximum Quantity</label>
                        <input
                          type="number"
                          min={1}
                          className={inputCls}
                          placeholder="100000"
                          value={settings.max_order_quantity}
                          onChange={(e) => set('max_order_quantity', Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-400 mt-1">Largest order a customer can place.</p>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-800 text-sm">Email Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <ToggleRow
                        label="New Order"
                        description="Send admin an email when a new order is placed"
                        checked={settings.notify_new_order}
                        onChange={(v) => set('notify_new_order', v)}
                      />
                      <ToggleRow
                        label="New Support Ticket"
                        description="Send admin an email when a ticket is opened"
                        checked={settings.notify_new_ticket}
                        onChange={(v) => set('notify_new_ticket', v)}
                      />
                    </div>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg ${settings.maintenance_mode ? 'bg-amber-50' : 'bg-gray-100'}`}>
                          <ShieldAlert className={`h-4 w-4 ${settings.maintenance_mode ? 'text-amber-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Maintenance Mode</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            When enabled, customers see a maintenance message instead of the site.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          settings.maintenance_mode ? 'bg-amber-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                            settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {settings.maintenance_mode && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-amber-700 font-medium">
                          Maintenance mode is ON. Customers cannot access the site.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" className={primaryCls} disabled={savingSettings}>
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : settingsSaved ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {settingsSaved ? 'Saved' : 'Save Settings'}
                </button>
                {settingsSaved && (
                  <span className="text-sm text-emerald-600 font-medium">Changes saved successfully.</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* ---- Providers Tab ---- */}
      {tab === 'providers' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">SMM Providers</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Connect providers that supply services. Their service lists and balances are fetched live.
              </p>
            </div>
            <button className={primaryCls} onClick={() => setShowAddProvider(true)}>
              <Plus className="h-4 w-4" />
              Add Provider
            </button>
          </div>

          {loadingProviders ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Server className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No providers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first SMM provider to start syncing services.
              </p>
              <button
                className={`${primaryCls} mx-auto mt-4`}
                onClick={() => setShowAddProvider(true)}
              >
                <Plus className="h-4 w-4" />
                Add Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  onEdit={() => setEditProvider(p)}
                  onDelete={() => setDeleteProvider(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddProvider && (
        <ProviderModal onClose={() => setShowAddProvider(false)} onSaved={handleProviderSaved} />
      )}
      {editProvider && (
        <ProviderModal
          provider={editProvider}
          onClose={() => setEditProvider(null)}
          onSaved={handleProviderSaved}
        />
      )}
      {deleteProvider && (
        <DeleteConfirm
          label={deleteProvider.name}
          onClose={() => setDeleteProvider(null)}
          onConfirm={handleDeleteProvider}
        />
      )}
    </div>
  );
};

export default SettingsPage;
