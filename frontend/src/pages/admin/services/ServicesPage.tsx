import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ---- Types ----

interface Provider {
  id: string;
  name: string;
  url: string;
  api_key: string;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  service_kind: string;
  subscription_name: string;
  comments_section: boolean;
  provider_id: string;
  provider_name: string;
  provider_service_id: string;
  category_id: string;
  category_name: string;
  type: string;
  mode: string;
  start_count_type: string;
  drip_feed: boolean;
  price_visible: boolean;
  rate: number;
  overflow: number;
  downflow: number;
  min: number;
  max: number;
  provider_rate: number;
  provider_min: number;
  provider_max: number;
  is_active: boolean;
  admin_note: string;
  created_at: string;
}

interface ProviderServiceItem {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}

// ---- Shared styles ----

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
const primaryCls =
  'flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const ghostCls =
  'flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors';
const cancelCls =
  'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors';

// ---- Modal ----

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

const Modal = ({ title, onClose, children, wide }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
    <div
      className={`relative bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col max-h-[90vh] ${
        wide ? 'w-full max-w-2xl' : 'w-full max-w-md'
      }`}
    >
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

// ---- Add Category Modal ----

interface AddCategoryModalProps {
  onClose: () => void;
  onCreated: (cat: Category) => void;
}

const AddCategoryModal = ({ onClose, onCreated }: AddCategoryModalProps) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post<Category>(API_ENDPOINTS.ADMIN_CATEGORIES, { name });
      onCreated(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Category" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category Name</label>
          <input
            className={inputCls}
            placeholder="e.g. YouTube Views"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Add / Edit Service Modal ----

interface ServiceFormModalProps {
  service?: Service;
  providers: Provider[];
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const ServiceFormModal = ({
  service,
  providers,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: ServiceFormModalProps) => {
  const isEdit = Boolean(service);

  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    provider_id: service?.provider_id ?? '',
    provider_service_id: service?.provider_service_id ?? '',
    category_id: service?.category_id ?? defaultCategoryId ?? '',
    type: service?.type ?? 'Default',
    mode: service?.mode ?? 'Manual',
    start_count_type: service?.start_count_type ?? 'Catch from supplier',
    drip_feed: service?.drip_feed ?? false,
    price_visible: service?.price_visible ?? true,
    rate: service?.rate?.toString() ?? '',
    overflow: service?.overflow?.toString() ?? '0',
    downflow: service?.downflow?.toString() ?? '0',
    min: service?.min?.toString() ?? '',
    max: service?.max?.toString() ?? '',
    provider_rate: service?.provider_rate?.toString() ?? '0',
    provider_min: service?.provider_min?.toString() ?? '0',
    provider_max: service?.provider_max?.toString() ?? '0',
    is_active: service?.is_active ?? true,
    admin_note: service?.admin_note ?? '',
  });

  const [providerServices, setProviderServices] = useState<ProviderServiceItem[]>([]);
  const [loadingProviderSvcs, setLoadingProviderSvcs] = useState(false);
  const [showProviderList, setShowProviderList] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProviderList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (form.provider_id) fetchProviderServices(form.provider_id);
  }, []);

  const fetchProviderServices = async (providerId: string) => {
    if (!providerId) return;
    setLoadingProviderSvcs(true);
    setProviderServices([]);
    try {
      const res = await api.get<ProviderServiceItem[]>(
        `${API_ENDPOINTS.ADMIN_PROVIDERS}/${providerId}/services`
      );
      setProviderServices(res.data);
    } catch {
      // user can still type manually
    } finally {
      setLoadingProviderSvcs(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setForm((f) => ({ ...f, provider_id: providerId, provider_service_id: '' }));
    setProviderSearch('');
    fetchProviderServices(providerId);
  };

  const handleSelectProviderSvc = (item: ProviderServiceItem) => {
    setForm((f) => ({
      ...f,
      provider_service_id: item.service,
      name: f.name || item.name,
      type: item.type || f.type,
      rate: item.rate,
      min: item.min,
      max: item.max,
      provider_rate: item.rate,
      provider_min: item.min,
      provider_max: item.max,
    }));
    setShowProviderList(false);
    setProviderSearch('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      provider_id: form.provider_id,
      provider_service_id: form.provider_service_id,
      category_id: form.category_id,
      type: form.type,
      mode: form.mode,
      start_count_type: form.start_count_type,
      drip_feed: form.drip_feed,
      price_visible: form.price_visible,
      rate: parseFloat(form.rate) || 0,
      overflow: parseFloat(form.overflow) || 0,
      downflow: parseFloat(form.downflow) || 0,
      min: parseInt(form.min) || 1,
      max: parseInt(form.max) || 1,
      provider_rate: parseFloat(form.provider_rate) || 0,
      provider_min: parseInt(form.provider_min) || 0,
      provider_max: parseInt(form.provider_max) || 0,
      is_active: form.is_active,
      admin_note: form.admin_note,
    };
    try {
      if (isEdit && service) {
        await api.patch(`${API_ENDPOINTS.ADMIN_SERVICES}/${service.id}`, payload);
      } else {
        await api.post(API_ENDPOINTS.ADMIN_SERVICES, payload);
      }
      onSaved();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
        ?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg).join(', '));
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to save service');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredProviderSvcs = providerSearch
    ? providerServices.filter(
        (s) =>
          s.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
          s.service.includes(providerSearch)
      )
    : providerServices;

  const selectedItem = providerServices.find((s) => s.service === form.provider_service_id);
  const isAutoLocked = form.mode === 'Auto' && !!selectedItem;

  useEffect(() => {
    if (form.mode !== 'Auto') return;
    const item = providerServices.find((s) => s.service === form.provider_service_id);
    if (!item) return;
    setForm((f) => ({
      ...f,
      name: item.name,
      type: item.type || f.type,
      rate: item.rate,
      min: item.min,
      max: item.max,
      provider_rate: item.rate,
      provider_min: item.min,
      provider_max: item.max,
    }));
  }, [form.mode, form.provider_service_id, providerServices]);

  return (
    <Modal title={isEdit ? 'Edit Service' : 'Add Service'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {/* Provider */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
            <select
              className={inputCls}
              value={form.provider_id}
              onChange={(e) => handleProviderChange(e.target.value)}
              required
            >
              <option value="">Select provider…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Provider service picker */}
          {form.provider_id && (
            <div className="col-span-2" ref={dropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Provider Service
                {loadingProviderSvcs && (
                  <span className="ml-2 text-gray-400 inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </span>
                )}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderList((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-left"
                >
                  <span className={selectedItem ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedItem
                      ? `#${selectedItem.service} — ${selectedItem.name}`
                      : 'Pick from provider list…'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>

                {showProviderList && providerServices.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        className={inputCls}
                        placeholder="Search by name or ID…"
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto">
                      {filteredProviderSvcs.map((item) => (
                        <button
                          key={item.service}
                          type="button"
                          onClick={() => handleSelectProviderSvc(item)}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex justify-between items-start gap-3 ${
                            form.provider_service_id === item.service
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                            #{item.service} · ${item.rate}/1k
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                className={`${inputCls} mt-2`}
                placeholder="Or type provider service ID manually"
                value={form.provider_service_id}
                onChange={(e) => setForm((f) => ({ ...f, provider_service_id: e.target.value }))}
                required
              />

              {selectedItem && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <span className="col-span-2 text-xs font-semibold text-blue-700 mb-0.5">
                    Provider data for #{selectedItem.service}
                  </span>
                  <span className="text-xs text-gray-500">Name</span>
                  <span className="text-xs text-gray-800 font-medium truncate">{selectedItem.name}</span>
                  <span className="text-xs text-gray-500">Type</span>
                  <span className="text-xs text-gray-800 font-medium">{selectedItem.type || '—'}</span>
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs text-gray-800 font-medium">{selectedItem.category || '—'}</span>
                  <span className="text-xs text-gray-500">Rate / 1k</span>
                  <span className="text-xs text-gray-800 font-medium">${selectedItem.rate}</span>
                  <span className="text-xs text-gray-500">Min</span>
                  <span className="text-xs text-gray-800 font-medium">{selectedItem.min}</span>
                  <span className="text-xs text-gray-500">Max</span>
                  <span className="text-xs text-gray-800 font-medium">{selectedItem.max}</span>
                </div>
              )}
            </div>
          )}

          {/* Service name */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
            <input
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              placeholder="e.g. YouTube Views — High Quality"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={isAutoLocked}
              required
            />
            {selectedItem && (
              <p className="mt-1 text-xs text-blue-500">Provider: {selectedItem.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Describe what this service delivers, quality, speed, etc."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              className={inputCls}
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              required
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedItem?.category && (
              <p className="mt-1 text-xs text-blue-500">Provider: {selectedItem.category}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Type</label>
            <select
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              disabled={isAutoLocked}
            >
              <option>Default</option>
              <option>Custom Comments</option>
              <option>Mentions</option>
              <option>Mentions with Hashtags</option>
              <option>Comment Likes</option>
              <option>Poll</option>
              <option>Invites from Groups</option>
              <option>Subscriptions</option>
            </select>
            {selectedItem?.type && (
              <p className="mt-1 text-xs text-blue-500">Provider: {selectedItem.type}</p>
            )}
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode: 'Manual' }))}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  form.mode === 'Manual'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, mode: 'Auto' }))}
                className={`px-5 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  form.mode === 'Auto'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Start Count Type */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Count Type</label>
            <select
              className={inputCls}
              value={form.start_count_type}
              onChange={(e) => setForm((f) => ({ ...f, start_count_type: e.target.value }))}
            >
              <option>Catch from supplier</option>
              <option>Custom</option>
              <option>Zero</option>
            </select>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rate (per 1000)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              placeholder="0.0000"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
              disabled={isAutoLocked}
              required
            />
            {selectedItem && (
              <p className="mt-1 text-xs text-blue-500">Provider: ${selectedItem.rate} / 1k</p>
            )}
          </div>

          {/* Price Visibility */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price Visibility</label>
            <select
              className={inputCls}
              value={form.price_visible ? 'Enable' : 'Disable'}
              onChange={(e) => setForm((f) => ({ ...f, price_visible: e.target.value === 'Enable' }))}
            >
              <option>Enable</option>
              <option>Disable</option>
            </select>
          </div>

          {/* Min */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Order</label>
            <input
              type="number"
              min="1"
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              placeholder="100"
              value={form.min}
              onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))}
              disabled={isAutoLocked}
              required
            />
            {selectedItem && (
              <p className="mt-1 text-xs text-blue-500">Provider: {selectedItem.min}</p>
            )}
          </div>

          {/* Max */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Order</label>
            <input
              type="number"
              min="1"
              className={`${inputCls} disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              placeholder="100000"
              value={form.max}
              onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
              disabled={isAutoLocked}
              required
            />
            {selectedItem && (
              <p className="mt-1 text-xs text-blue-500">Provider: {selectedItem.max}</p>
            )}
          </div>

          {/* Overflow */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Overflow %</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`${inputCls} pr-8`}
                placeholder="0"
                value={form.overflow}
                onChange={(e) => setForm((f) => ({ ...f, overflow: e.target.value }))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* Downflow */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Downflow %</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className={`${inputCls} pr-8`}
                placeholder="0"
                value={form.downflow}
                onChange={(e) => setForm((f) => ({ ...f, downflow: e.target.value }))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* DripFeed + Active toggles */}
          <div className="col-span-2 flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, drip_feed: !f.drip_feed }))}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  form.drip_feed ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.drip_feed ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-700">DripFeed</span>
              <span className={`text-xs font-medium ${form.drip_feed ? 'text-teal-600' : 'text-gray-400'}`}>
                {form.drip_feed ? 'Active' : 'Non Active'}
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  form.is_active ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-700">Active</span>
              <span className={`text-xs font-medium ${form.is_active ? 'text-teal-600' : 'text-gray-400'}`}>
                {form.is_active ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Admin Note */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Admin Secret Note <span className="text-gray-400 font-normal">(not visible to customers)</span>
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Internal notes about this service…"
              value={form.admin_note}
              onChange={(e) => setForm((f) => ({ ...f, admin_note: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Subscription form modal ----

interface SubscriptionFormModalProps {
  subscription?: Service;
  providers: Provider[];
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const SubscriptionFormModal = ({
  subscription,
  providers,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: SubscriptionFormModalProps) => {
  const isEdit = Boolean(subscription);
  const [form, setForm] = useState({
    category_id: subscription?.category_id ?? defaultCategoryId ?? '',
    subscription_name: subscription?.subscription_name ?? '',
    name: subscription?.name ?? '',
    rate: subscription?.rate?.toString() ?? '',
    min: subscription?.min?.toString() ?? '',
    max: subscription?.max?.toString() ?? '',
    overflow: subscription?.overflow?.toString() ?? '0',
    downflow: subscription?.downflow?.toString() ?? '0',
    description: subscription?.description ?? '',
    provider_id: subscription?.provider_id ?? '',
    provider_service_id: subscription?.provider_service_id ?? '',
    comments_section: subscription?.comments_section ?? false,
    is_active: subscription?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      service_kind: 'subscription',
      category_id: form.category_id,
      subscription_name: form.subscription_name,
      name: form.name,
      rate: parseFloat(form.rate) || 0,
      min: parseInt(form.min) || 1,
      max: parseInt(form.max) || 1,
      overflow: parseFloat(form.overflow) || 0,
      downflow: parseFloat(form.downflow) || 0,
      description: form.description,
      provider_id: form.provider_id,
      provider_service_id: form.provider_service_id,
      comments_section: form.comments_section,
      is_active: form.is_active,
      // defaults for unused service fields
      type: 'Default',
      mode: 'Auto',
      start_count_type: 'Catch from supplier',
      drip_feed: false,
      price_visible: true,
      admin_note: '',
    };
    try {
      if (isEdit && subscription) {
        await api.patch(`${API_ENDPOINTS.ADMIN_SERVICES}/${subscription.id}`, payload);
      } else {
        await api.post(API_ENDPOINTS.ADMIN_SERVICES, payload);
      }
      onSaved();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg).join(', '));
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to save subscription');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Subscription' : 'Add Subscription'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              className={inputCls}
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              required
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subscription name */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Subscription</label>
            <input
              className={inputCls}
              placeholder="e.g. Instagram Auto Likes"
              value={form.subscription_name}
              onChange={(e) => setForm((f) => ({ ...f, subscription_name: e.target.value }))}
              required
            />
          </div>

          {/* Service name */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
            <input
              className={inputCls}
              placeholder="e.g. Auto Likes — High Quality"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Service Price */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Price</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              className={inputCls}
              placeholder="0.0000"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
              required
            />
          </div>

          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Select API</label>
            <select
              className={inputCls}
              value={form.provider_id}
              onChange={(e) => setForm((f) => ({ ...f, provider_id: e.target.value }))}
              required
            >
              <option value="">Select API…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Min */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Amount</label>
            <input
              type="number"
              min="1"
              className={inputCls}
              placeholder="100"
              value={form.min}
              onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))}
              required
            />
          </div>

          {/* Max */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Amount</label>
            <input
              type="number"
              min="1"
              className={inputCls}
              placeholder="100000"
              value={form.max}
              onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
              required
            />
          </div>

          {/* Overflow */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Overflow %</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={inputCls}
              placeholder="0"
              value={form.overflow}
              onChange={(e) => setForm((f) => ({ ...f, overflow: e.target.value }))}
            />
          </div>

          {/* Downflow */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Downflow %</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className={inputCls}
              placeholder="0"
              value={form.downflow}
              onChange={(e) => setForm((f) => ({ ...f, downflow: e.target.value }))}
            />
          </div>

          {/* API Service ID */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">API Service ID</label>
            <input
              className={inputCls}
              placeholder="Service ID from the API provider"
              value={form.provider_service_id}
              onChange={(e) => setForm((f) => ({ ...f, provider_service_id: e.target.value }))}
              required
            />
          </div>

          {/* Service Details */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Service Details <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Describe what this subscription delivers…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Comments Section + Status toggles */}
          <div className="col-span-2 flex flex-wrap gap-6 pt-1">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Comments Section</span>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, comments_section: !f.comments_section }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    form.comments_section ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.comments_section ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className={`text-xs font-medium ${form.comments_section ? 'text-teal-600' : 'text-gray-400'}`}>
                  {form.comments_section ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Status</span>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    form.is_active ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className={`text-xs font-medium ${form.is_active ? 'text-teal-600' : 'text-gray-400'}`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Subscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Delete confirm ----

interface DeleteModalProps {
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteModal = ({ label, onClose, onConfirm }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to delete <span className="font-medium text-gray-900">{label}</span>?
        This cannot be undone.
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

// ---- Dropdown menu helper ----

interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  label: React.ReactNode;
  items: DropdownItem[];
  alignRight?: boolean;
}

const DropdownMenu = ({ label, items, alignRight }: DropdownMenuProps) => {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pos) { setPos(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = items.length * 36 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;
    const vertical = openUpward
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 };
    setPos(
      alignRight
        ? { ...vertical, right: window.innerWidth - rect.right }
        : { ...vertical, left: rect.left }
    );
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-600 font-medium hover:bg-gray-50 transition-colors"
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {pos && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setPos(null)} />
          <div
            className="fixed z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40"
            style={pos}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => { item.onClick(); setPos(null); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};

// ---- Category section ----

interface CategorySectionProps {
  category: Category | null;
  services: Service[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onEdit: (svc: Service) => void;
  onDelete: (svc: Service) => void;
  onToggleActive: (svc: Service) => void;
  onAddService: (categoryId: string) => void;
  onAddSubscription: (categoryId: string) => void;
  onDeleteCategory: (cat: Category) => void;
  providerSvcMap: Record<string, ProviderServiceItem>;
}

const CategorySection = ({
  category,
  services,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onToggleActive,
  onAddService,
  onAddSubscription,
  onDeleteCategory,
  providerSvcMap,
}: CategorySectionProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Service | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof Service) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const displayServices = sortKey
    ? [...services].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortDir === 'asc' ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
        }
        const aStr = String(aVal ?? '').toLowerCase();
        const bStr = String(bVal ?? '').toLowerCase();
        return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      })
    : services;

  const ids = displayServices.map((s) => s.id);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
  const someChecked = ids.some((id) => selected.has(id));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
      {/* Category header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-800 text-sm flex-1">
          {category ? category.name : 'Uncategorized'}
          <span className="ml-2 text-xs font-normal text-gray-400">{services.length} service{services.length !== 1 ? 's' : ''}</span>
        </span>

        {category && (
          <DropdownMenu
            label="Actions"
            items={[
              {
                label: 'Add service here',
                onClick: () => onAddService(category.id),
              },
              {
                label: 'Add subscription here',
                onClick: () => onAddSubscription(category.id),
              },
              {
                label: 'Delete category',
                onClick: () => onDeleteCategory(category),
                danger: true,
              },
            ]}
          />
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
        >
          {collapsed ? (
            <>Show services <ChevronDown className="h-3 w-3" /></>
          ) : (
            <>Hide services <ChevronUp className="h-3 w-3" /></>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 w-8">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={(e) => onToggleSelectAll(ids, e.target.checked)}
                  />
                </th>
                {(
                  [
                    { label: 'ID',       key: 'provider_service_id' },
                    { label: 'Service',  key: 'name' },
                    { label: 'Type',     key: 'type' },
                    { label: 'Provider', key: 'provider_name' },
                    { label: 'Rate',     key: 'rate' },
                    { label: 'Min',      key: 'min' },
                    { label: 'Max',      key: 'max' },
                    { label: 'Status',   key: 'is_active' },
                    { label: '',         key: null },
                  ] as { label: string; key: keyof Service | null }[]
                ).map(({ label, key }) => (
                  <th
                    key={label || '__actions__'}
                    onClick={() => key && handleSort(key)}
                    className={`px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap ${key ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && sortKey === key && (
                        sortDir === 'asc'
                          ? <ChevronUp className="h-3 w-3 text-teal-600" />
                          : <ChevronDown className="h-3 w-3 text-teal-600" />
                      )}
                      {key && sortKey !== key && (
                        <ChevronDown className="h-3 w-3 text-gray-300" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayServices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-400">
                    No services in this category.
                  </td>
                </tr>
              ) : (
                displayServices.map((svc) => (
                  <tr
                    key={svc.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      selected.has(svc.id) ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        checked={selected.has(svc.id)}
                        onChange={() => onToggleSelect(svc.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {svc.provider_service_id}
                    </td>
                    <td className="px-3 py-3 text-gray-900 max-w-xs">
                      <span className="font-medium leading-snug block truncate">{svc.name}</span>
                      {svc.service_kind === 'subscription' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600 mt-0.5">
                          Subscription
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {svc.type || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="block text-gray-800 text-xs font-medium">{svc.provider_name || '—'}</span>
                      <span className="block text-gray-400 text-xs">{svc.provider_service_id}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {(() => {
                        const live = providerSvcMap[`${svc.provider_id}_${svc.provider_service_id}`];
                        const apiRate = live ? parseFloat(live.rate) : null;
                        return (
                          <>
                            <span className="block text-gray-800 text-xs font-medium">${svc.rate.toFixed(4)}</span>
                            {apiRate !== null && (
                              <span className={`block text-xs mt-0.5 ${apiRate !== svc.rate ? 'text-amber-500' : 'text-gray-400'}`}>
                                API: ${apiRate.toFixed(4)}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {(() => {
                        const live = providerSvcMap[`${svc.provider_id}_${svc.provider_service_id}`];
                        const apiMin = live ? parseInt(live.min) : null;
                        return (
                          <>
                            <span className="block text-gray-600">{svc.min.toLocaleString()}</span>
                            {apiMin !== null && (
                              <span className={`block text-xs mt-0.5 ${apiMin !== svc.min ? 'text-amber-500' : 'text-gray-400'}`}>
                                API: {apiMin.toLocaleString()}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {(() => {
                        const live = providerSvcMap[`${svc.provider_id}_${svc.provider_service_id}`];
                        const apiMax = live ? parseInt(live.max) : null;
                        return (
                          <>
                            <span className="block text-gray-600">{svc.max.toLocaleString()}</span>
                            {apiMax !== null && (
                              <span className={`block text-xs mt-0.5 ${apiMax !== svc.max ? 'text-amber-500' : 'text-gray-400'}`}>
                                API: {apiMax.toLocaleString()}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          svc.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            svc.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        {svc.is_active ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu
                        label="Actions"
                        alignRight
                        items={[
                          { label: 'Edit', onClick: () => onEdit(svc) },
                          {
                            label: svc.is_active ? 'Disable' : 'Enable',
                            onClick: () => onToggleActive(svc),
                          },
                          { label: 'Delete', onClick: () => onDelete(svc), danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---- Main page ----

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRateMin, setFilterRateMin] = useState('');
  const [filterRateMax, setFilterRateMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [providerSvcMap, setProviderSvcMap] = useState<Record<string, ProviderServiceItem>>({});

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showAddService, setShowAddService] = useState(false);
  const [addServiceCategory, setAddServiceCategory] = useState<string>('');
  const [editService, setEditService] = useState<Service | null>(null);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [addSubscriptionCategory, setAddSubscriptionCategory] = useState<string>('');
  const [editSubscription, setEditSubscription] = useState<Service | null>(null);
  const [deleteService, setDeleteService] = useState<Service | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchProviderSvcMap = async (svcs: Service[]) => {
    const uniqueProviderIds = [...new Set(svcs.map((s) => s.provider_id).filter(Boolean))];
    const results = await Promise.allSettled(
      uniqueProviderIds.map((pid) =>
        api
          .get<ProviderServiceItem[]>(`${API_ENDPOINTS.ADMIN_PROVIDERS}/${pid}/services`)
          .then((res) => ({ pid, items: res.data }))
      )
    );
    const map: Record<string, ProviderServiceItem> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const item of result.value.items) {
          map[`${result.value.pid}_${item.service}`] = item;
        }
      }
    }
    setProviderSvcMap(map);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, provRes, catRes] = await Promise.all([
        api.get<Service[]>(API_ENDPOINTS.ADMIN_SERVICES),
        api.get<Provider[]>(API_ENDPOINTS.ADMIN_PROVIDERS),
        api.get<Category[]>(API_ENDPOINTS.ADMIN_CATEGORIES),
      ]);
      setServices(svcRes.data);
      setProviders(provRes.data);
      setCategories(catRes.data);
      fetchProviderSvcMap(svcRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleActive = async (svc: Service) => {
    await api.patch(`${API_ENDPOINTS.ADMIN_SERVICES}/${svc.id}`, { is_active: !svc.is_active });
    setServices((prev) =>
      prev.map((s) => (s.id === svc.id ? { ...s, is_active: !svc.is_active } : s))
    );
  };

  const handleDeleteService = async () => {
    if (!deleteService) return;
    await api.delete(`${API_ENDPOINTS.ADMIN_SERVICES}/${deleteService.id}`);
    setServices((prev) => prev.filter((s) => s.id !== deleteService.id));
    setSelected((prev) => { const next = new Set(prev); next.delete(deleteService.id); return next; });
    setDeleteService(null);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    await api.delete(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${deleteCategory.id}`);
    setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
    setDeleteCategory(null);
  };

  const handleEdit = (svc: Service) => {
    if (svc.service_kind === 'subscription') {
      setEditSubscription(svc);
    } else {
      setEditService(svc);
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all(
      [...selected].map((id) => api.delete(`${API_ENDPOINTS.ADMIN_SERVICES}/${id}`))
    );
    setServices((prev) => prev.filter((s) => !selected.has(s.id)));
    setSelected(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleExport = () => {
    const rows = services.map((s) => ({
      id: s.provider_service_id,
      name: s.name,
      category: s.category_name,
      provider: s.provider_name,
      type: s.type,
      rate: s.rate,
      min: s.min,
      max: s.max,
      status: s.is_active ? 'Enabled' : 'Disabled',
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const body = rows.map((r) => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const activeFilterCount = [filterProvider, filterStatus, filterRateMin, filterRateMax].filter(Boolean).length;

  const clearFilters = () => {
    setFilterProvider('');
    setFilterStatus('');
    setFilterRateMin('');
    setFilterRateMax('');
  };

  const filtered = services.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.provider_service_id.includes(search)) return false;
    if (filterProvider && s.provider_id !== filterProvider) return false;
    if (filterStatus === 'active' && !s.is_active) return false;
    if (filterStatus === 'inactive' && s.is_active) return false;
    if (filterRateMin && s.rate < parseFloat(filterRateMin)) return false;
    if (filterRateMax && s.rate > parseFloat(filterRateMax)) return false;
    return true;
  });

  const servicesByCategory: { category: Category | null; services: Service[] }[] = [
    ...categories.map((cat) => ({
      category: cat,
      services: filtered.filter((s) => s.category_id === cat.id),
    })),
  ];

  const uncategorized = filtered.filter(
    (s) => !categories.some((c) => c.id === s.category_id)
  );
  if (uncategorized.length > 0) {
    servicesByCategory.push({ category: null, services: uncategorized });
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your SMM services and categories.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Left actions */}
        <button className={primaryCls} onClick={() => { setAddServiceCategory(''); setShowAddService(true); }}>
          <Plus className="h-4 w-4" />
          Add service
        </button>

        <button className={ghostCls} onClick={() => { setAddSubscriptionCategory(''); setShowAddSubscription(true); }}>
          <Plus className="h-4 w-4" />
          Add subscription
        </button>

        <button className={ghostCls} onClick={() => setShowAddCategory(true)}>
          <Tag className="h-4 w-4" />
          Add category
        </button>

        {selected.size > 0 && (
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            onClick={() => setBulkDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selected.size})
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right actions */}
        <button className={ghostCls} onClick={fetchAll}>
          <RefreshCw className="h-4 w-4" />
          Sync
        </button>

        <button className={ghostCls} onClick={handleExport} disabled={services.length === 0}>
          <Download className="h-4 w-4" />
          Export
        </button>

        <button
          className={`${ghostCls} relative`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-52"
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Provider</label>
            <select
              className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
            >
              <option value="">All</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Rate / 1k</label>
            <input
              type="number"
              min="0"
              step="0.0001"
              placeholder="Min $"
              className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filterRateMin}
              onChange={(e) => setFilterRateMin(e.target.value)}
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              placeholder="Max $"
              className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={filterRateMax}
              onChange={(e) => setFilterRateMax(e.target.value)}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : categories.length === 0 && services.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-base font-medium text-gray-500 mb-1">No services yet</p>
          <p className="text-sm">Start by adding a category, then add services under it.</p>
        </div>
      ) : (
        servicesByCategory.map(({ category, services: svcs }) => (
          <CategorySection
            key={category?.id ?? '__uncategorized__'}
            category={category}
            services={svcs}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEdit={handleEdit}
            onDelete={setDeleteService}
            onToggleActive={handleToggleActive}
            onAddService={(catId) => { setAddServiceCategory(catId); setShowAddService(true); }}
            onAddSubscription={(catId) => { setAddSubscriptionCategory(catId); setShowAddSubscription(true); }}
            onDeleteCategory={setDeleteCategory}
            providerSvcMap={providerSvcMap}
          />
        ))
      )}

      {/* Modals */}
      {showAddService && (
        <ServiceFormModal
          providers={providers}
          categories={categories}
          defaultCategoryId={addServiceCategory}
          onClose={() => setShowAddService(false)}
          onSaved={() => { setShowAddService(false); fetchAll(); }}
        />
      )}

      {editService && (
        <ServiceFormModal
          service={editService}
          providers={providers}
          categories={categories}
          onClose={() => setEditService(null)}
          onSaved={() => { setEditService(null); fetchAll(); }}
        />
      )}

      {showAddSubscription && (
        <SubscriptionFormModal
          providers={providers}
          categories={categories}
          defaultCategoryId={addSubscriptionCategory}
          onClose={() => setShowAddSubscription(false)}
          onSaved={() => { setShowAddSubscription(false); fetchAll(); }}
        />
      )}

      {editSubscription && (
        <SubscriptionFormModal
          subscription={editSubscription}
          providers={providers}
          categories={categories}
          onClose={() => setEditSubscription(null)}
          onSaved={() => { setEditSubscription(null); fetchAll(); }}
        />
      )}

      {deleteService && (
        <DeleteModal
          label={deleteService.name}
          onClose={() => setDeleteService(null)}
          onConfirm={handleDeleteService}
        />
      )}

      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onCreated={(cat) => { setCategories((prev) => [...prev, cat]); setShowAddCategory(false); }}
        />
      )}

      {deleteCategory && (
        <DeleteModal
          label={deleteCategory.name}
          onClose={() => setDeleteCategory(null)}
          onConfirm={handleDeleteCategory}
        />
      )}

      {bulkDeleteConfirm && (
        <DeleteModal
          label={`${selected.size} selected service${selected.size !== 1 ? 's' : ''}`}
          onClose={() => setBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
};

export default ServicesPage;
