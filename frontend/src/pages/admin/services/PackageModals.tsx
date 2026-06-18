import { useEffect, useRef, useState } from 'react';
import { Copy, Loader2, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
}

export interface ProviderService {
  service: string;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
}

export interface FallbackService {
  provider_id: string;
  provider_service_id: string;
  provider_service_name: string;
  provider_name: string;
  provider_rate: number;
  min: number;
  max: number;
  is_active: boolean;
  description: string;
  service_label: string;
  mode: 'manual' | 'auto';
  start_count_type: 'supplier' | 'custom' | 'zero';
}

export interface ServicePackage {
  id: string;
  service_type: string;
  package_type: string;
  quantity: number;
  provider_id: string;
  provider_service_id: string;
  provider_service_name: string;
  provider_name: string;
  provider_rate: number;
  portal_rate: number;
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value: number;
  min: number;
  max: number;
  priority: number;
  is_active: boolean;
  admin_note: string;
  description: string;
  service_label: string;
  mode: 'manual' | 'auto';
  start_count_type: 'supplier' | 'custom' | 'zero';
  fallbacks: FallbackService[];
  created_at: string;
  updated_at: string;
}

// ── Price calculation ─────────────────────────────────────────────────────────

export function calcPrice(
  quantity: number,
  portal_rate: number,
  discount_type: 'none' | 'fixed' | 'percentage',
  discount_value: number,
): { base: number; final: number } {
  const base = (quantity / 1000) * portal_rate;
  let final = base;
  if (discount_type === 'fixed') final = Math.max(0, base - discount_value);
  if (discount_type === 'percentage') final = Math.max(0, base * (1 - discount_value / 100));
  return { base: Math.round(base * 10000) / 10000, final: Math.round(final * 10000) / 10000 };
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500';
const primaryCls =
  'flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const cancelCls =
  'px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

const SERVICE_LABELS = [
  'Standard', 'Premium', 'HQ', 'Organic', 'Real', 'Bot', 'Instant', 'Drip Feed', 'Guaranteed',
] as const;

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col max-h-[92vh] w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ── Provider + Service selector (shared between both modals) ──────────────────

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviderId: string;
  selectedServiceId: string;
  onProviderChange: (id: string) => void;
  onServiceSelect: (svc: ProviderService) => void;
  onServiceClear?: () => void;
}

export const ProviderServiceSelector = ({
  providers,
  selectedProviderId,
  selectedServiceId,
  onProviderChange,
  onServiceSelect,
  onServiceClear,
}: ProviderSelectorProps) => {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedProviderId) { setServices([]); setSearch(''); return; }
    setLoading(true);
    api
      .get<ProviderService[]>(`${API_ENDPOINTS.ADMIN_PROVIDERS}/${selectedProviderId}/services`)
      .then((r) => setServices(r.data))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [selectedProviderId]);

  const q = search.toLowerCase();
  const filtered = q
    ? services.filter((s) => s.name.toLowerCase().includes(q) || s.service.includes(q))
    : services;

  const selectedSvc = services.find((s) => s.service === selectedServiceId);

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>Provider</label>
        <select
          className={inputCls}
          value={selectedProviderId}
          onChange={(e) => onProviderChange(e.target.value)}
        >
          <option value="">Select provider…</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedProviderId && (
        <div>
          <label className={labelCls}>Service</label>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching services…
            </div>
          ) : (
            <>
              {selectedSvc && (
                <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-2">
                  <div className="text-xs text-teal-800 min-w-0 truncate">
                    <span className="font-medium">[{selectedSvc.service}]</span>{' '}
                    {selectedSvc.name}
                    <span className="text-teal-600 ml-2">${selectedSvc.rate}/1k</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onServiceClear?.()}
                    className="text-teal-400 hover:text-teal-600 ml-2 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputCls} pl-8`}
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-44 divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    {search ? 'No services match your search.' : 'No services available.'}
                  </p>
                ) : (
                  filtered.map((s) => {
                    const isSelected = s.service === selectedServiceId;
                    return (
                      <button
                        key={s.service}
                        type="button"
                        onClick={() => { onServiceSelect(s); setSearch(''); }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                          isSelected ? 'bg-teal-50 text-teal-800' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">[{s.service}]</span> {s.name}
                        <span className="text-gray-400 ml-2">
                          ${s.rate}/1k · min {s.min} · max {s.max}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Add / Edit Quantity Modal ──────────────────────────────────────────────────

interface AddQuantityModalProps {
  serviceType: string;
  packageType: 'value' | 'bulk';
  serviceLabel: string;
  providers: Provider[];
  existing?: ServicePackage;
  existingQuantities?: number[];
  onClose: () => void;
  onSaved: (pkg: ServicePackage) => void;
}

export const AddQuantityModal = ({
  serviceType,
  packageType,
  serviceLabel,
  providers,
  existing,
  existingQuantities,
  onClose,
  onSaved,
}: AddQuantityModalProps) => {
  const isEdit = Boolean(existing);

  const [quantity, setQuantity] = useState(existing?.quantity.toString() ?? '');
  const [providerId, setProviderId] = useState(existing?.provider_id ?? '');
  const [serviceId, setServiceId] = useState(existing?.provider_service_id ?? '');
  const [serviceName, setServiceName] = useState(existing?.provider_service_name ?? '');
  const [providerName, setProviderName] = useState(existing?.provider_name ?? '');
  const [providerRate, setProviderRate] = useState(existing?.provider_rate ?? 0);
  const [min, setMin] = useState(existing?.min ?? 0);
  const [max, setMax] = useState(existing?.max ?? 0);
  const [portalRate, setPortalRate] = useState(existing?.portal_rate.toString() ?? '');
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percentage'>(
    existing?.discount_type ?? 'none',
  );
  const [discountValue, setDiscountValue] = useState(existing?.discount_value.toString() ?? '0');
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [adminNote, setAdminNote] = useState(existing?.admin_note ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [pkgLabel, setPkgLabel] = useState(existing?.service_label ?? '');
  const [mode, setMode] = useState<'manual' | 'auto'>(existing?.mode ?? 'manual');
  const [startCountType, setStartCountType] = useState<'supplier' | 'custom' | 'zero'>(
    existing?.start_count_type ?? 'supplier',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const qty = parseInt(quantity, 10) || 0;
  const pRate = parseFloat(portalRate) || 0;
  const dVal = parseFloat(discountValue) || 0;
  const { base, final } = calcPrice(qty, pRate, discountType, dVal);
  const providerCost = qty > 0 ? Math.round((qty / 1000) * providerRate * 10000) / 10000 : 0;

  const handleServiceSelect = (svc: ProviderService) => {
    setServiceId(svc.service);
    setServiceName(svc.name);
    setProviderRate(parseFloat(svc.rate) || 0);
    setMin(parseInt(svc.min, 10) || 0);
    setMax(parseInt(svc.max, 10) || 0);
    const p = providers.find((pr) => pr.id === providerId);
    if (p) setProviderName(p.name);
  };

  const handleServiceClear = () => {
    setServiceId('');
    setServiceName('');
    setProviderRate(0);
    setMin(0);
    setMax(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !serviceId || !portalRate) {
      setError('Fill in quantity, service, and portal rate.');
      return;
    }
    if (!isEdit && existingQuantities?.includes(qty)) {
      setError(`A package with ${qty.toLocaleString()} units already exists in this section. Each quantity must be unique.`);
      return;
    }
    if (min > 0 && qty < min) {
      setError(`The selected service requires a minimum of ${min.toLocaleString()} units. Increase the quantity or choose a different service.`);
      return;
    }
    if (max > 0 && qty > max) {
      setError(`The selected service allows a maximum of ${max.toLocaleString()} units. Decrease the quantity or choose a different service.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        service_type: serviceType,
        package_type: packageType,
        quantity: qty,
        provider_id: providerId,
        provider_service_id: serviceId,
        provider_service_name: serviceName,
        provider_name: providerName,
        provider_rate: providerRate,
        portal_rate: pRate,
        discount_type: discountType,
        discount_value: dVal,
        min,
        max,
        is_active: isActive,
        admin_note: adminNote,
        description,
        service_label: pkgLabel,
        mode,
        start_count_type: startCountType,
      };
      const res = isEdit
        ? await api.put<ServicePackage>(`${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${existing!.id}`, payload)
        : await api.post<ServicePackage>(API_ENDPOINTS.ADMIN_SERVICE_PACKAGES, payload);
      onSaved(res.data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`${isEdit ? 'Edit' : 'Add'} Quantity — ${serviceLabel} (${packageType})`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantity */}
        <div>
          <label className={labelCls}>Quantity</label>
          <input
            type="number"
            min="1"
            className={inputCls}
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            disabled={isEdit}
          />
        </div>

        {/* Provider + Service */}
        <ProviderServiceSelector
          providers={providers}
          selectedProviderId={providerId}
          selectedServiceId={serviceId}
          onProviderChange={setProviderId}
          onServiceSelect={handleServiceSelect}
          onServiceClear={handleServiceClear}
        />

        {/* Provider info row */}
        {serviceId && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Provider price/1k</label>
              <input className={inputCls} value={`$${providerRate.toFixed(4)}`} disabled />
            </div>
            <div>
              <label className={labelCls}>Min</label>
              <input className={inputCls} value={min.toLocaleString()} disabled />
            </div>
            <div>
              <label className={labelCls}>Max</label>
              <input className={inputCls} value={max.toLocaleString()} disabled />
            </div>
          </div>
        )}

        {/* Portal rate */}
        <div>
          <label className={labelCls}>Portal rate ($/1000)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              className={`${inputCls} pl-7`}
              placeholder="0.0000"
              value={portalRate}
              onChange={(e) => setPortalRate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <label className={labelCls}>Discount</label>
          <div className="flex gap-2">
            {(['none', 'fixed', 'percentage'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiscountType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  discountType === t
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t === 'none' ? 'None' : t === 'fixed' ? 'Fixed ($)' : '% Off'}
              </button>
            ))}
          </div>
          {discountType !== 'none' && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {discountType === 'fixed' ? '$' : '%'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputCls} pl-7`}
                placeholder="0.00"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Price preview */}
        {qty > 0 && pRate > 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Preview</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Provider cost ({qty.toLocaleString()} units)</span>
              <span className="font-mono text-orange-600">${providerCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Portal base price</span>
              <span className="font-mono text-gray-700">${base.toFixed(4)}</span>
            </div>
            {discountType !== 'none' && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">After discount</span>
                <span className="font-mono text-teal-700 font-semibold">${final.toFixed(4)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-semibold border-t border-gray-200 pt-1.5">
              <span className="text-gray-700">User pays</span>
              <span className="font-mono text-teal-700">${final.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-3">
        
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Shown to customers…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service label</label>
              <select
                className={inputCls}
                value={pkgLabel}
                onChange={(e) => setPkgLabel(e.target.value)}
              >
                <option value="">No label</option>
                {SERVICE_LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Mode</label>
              <div className="flex gap-1.5 mt-1">
                {(['manual', 'auto'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      mode === m
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'manual' ? 'Manual' : 'Auto'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Start count type</label>
            <select
              className={inputCls}
              value={startCountType}
              onChange={(e) => setStartCountType(e.target.value as 'supplier' | 'custom' | 'zero')}
            >
              <option value="supplier">Catch from supplier</option>
              <option value="custom">Custom</option>
              <option value="zero">Zero</option>
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="pkg-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="pkg-active" className="text-sm text-gray-700">Active</label>
        </div>

        {/* Admin note */}
        <div>
          <label className={labelCls}>Admin note (private)</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            placeholder="Internal notes…"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Add quantity'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Add Fallback Modal ────────────────────────────────────────────────────────

interface AddFallbackModalProps {
  parent: ServicePackage;
  providers: Provider[];
  onClose: () => void;
  onSaved: (pkg: ServicePackage) => void;
}

export const AddFallbackModal = ({
  parent,
  providers,
  onClose,
  onSaved,
}: AddFallbackModalProps) => {
  const [providerId, setProviderId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerRate, setProviderRate] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [pkgLabel, setPkgLabel] = useState('');
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [startCountType, setStartCountType] = useState<'supplier' | 'custom' | 'zero'>('supplier');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleServiceSelect = (svc: ProviderService) => {
    setServiceId(svc.service);
    setServiceName(svc.name);
    setProviderRate(parseFloat(svc.rate) || 0);
    setMin(parseInt(svc.min, 10) || 0);
    setMax(parseInt(svc.max, 10) || 0);
    const p = providers.find((pr) => pr.id === providerId);
    if (p) setProviderName(p.name);
  };

  const handleServiceClear = () => {
    setServiceId('');
    setServiceName('');
    setProviderRate(0);
    setMin(0);
    setMax(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) { setError('Select a service.'); return; }

    const isDefaultDuplicate =
      providerId === parent.provider_id && serviceId === parent.provider_service_id;
    const isFallbackDuplicate = parent.fallbacks.some(
      (fb) => fb.provider_id === providerId && fb.provider_service_id === serviceId,
    );
    if (isDefaultDuplicate || isFallbackDuplicate) {
      setError(
        `${providerId === parent.provider_id && serviceId === parent.provider_service_id
          ? 'This service is already the default for this package.'
          : 'This provider + service combination is already a fallback for this package.'
        } Each provider–service pair must be unique.`,
      );
      return;
    }

    if (min > 0 && parent.quantity < min) {
      setError(`This service requires a minimum of ${min.toLocaleString()} units, but this package is for ${parent.quantity.toLocaleString()} units. Choose a different service.`);
      return;
    }
    if (max > 0 && parent.quantity > max) {
      setError(`This service allows a maximum of ${max.toLocaleString()} units, but this package is for ${parent.quantity.toLocaleString()} units. Choose a different service.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post<ServicePackage>(
        `${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${parent.id}/fallbacks`,
        {
          provider_id: providerId,
          provider_service_id: serviceId,
          provider_service_name: serviceName,
          provider_name: providerName,
          provider_rate: providerRate,
          min,
          max,
          is_active: isActive,
          description,
          service_label: pkgLabel,
          mode,
          start_count_type: startCountType,
        },
      );
      onSaved(res.data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const { final } = calcPrice(parent.quantity, parent.portal_rate, parent.discount_type, parent.discount_value);

  return (
    <Modal title={`Add Fallback — ${parent.quantity.toLocaleString()} units`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inherited info */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Inherited from default</p>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Quantity</span>
            <span className="font-medium">{parent.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Portal price</span>
            <span className="font-medium text-teal-700">${final.toFixed(2)}</span>
          </div>
        </div>

        {/* Provider + Service */}
        <ProviderServiceSelector
          providers={providers}
          selectedProviderId={providerId}
          selectedServiceId={serviceId}
          onProviderChange={setProviderId}
          onServiceSelect={handleServiceSelect}
          onServiceClear={handleServiceClear}
        />

        {serviceId && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Provider price/1k</label>
              <input className={inputCls} value={`$${providerRate.toFixed(4)}`} disabled />
            </div>
            <div>
              <label className={labelCls}>Min</label>
              <input className={inputCls} value={min.toLocaleString()} disabled />
            </div>
            <div>
              <label className={labelCls}>Max</label>
              <input className={inputCls} value={max.toLocaleString()} disabled />
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Shown to customers…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service label</label>
              <select
                className={inputCls}
                value={pkgLabel}
                onChange={(e) => setPkgLabel(e.target.value)}
              >
                <option value="">No label</option>
                {SERVICE_LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Mode</label>
              <div className="flex gap-1.5 mt-1">
                {(['manual', 'auto'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      mode === m
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'manual' ? 'Manual' : 'Auto'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Start count type</label>
            <select
              className={inputCls}
              value={startCountType}
              onChange={(e) => setStartCountType(e.target.value as 'supplier' | 'custom' | 'zero')}
            >
              <option value="supplier">Catch from supplier</option>
              <option value="custom">Custom</option>
              <option value="zero">Zero</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="fb-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="fb-active" className="text-sm text-gray-700">Active</label>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving || !serviceId}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add fallback
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Duplicate Modal ───────────────────────────────────────────────────────────

interface DuplicateModalProps {
  pkg: ServicePackage;
  existingQuantities: number[];
  onClose: () => void;
  onSaved: (newPkg: ServicePackage) => void;
}

export const DuplicateModal = ({ pkg, existingQuantities, onClose, onSaved }: DuplicateModalProps) => {
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { final: sourcePrice } = calcPrice(pkg.quantity, pkg.portal_rate, pkg.discount_type, pkg.discount_value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) { setError('Enter a valid quantity greater than 0.'); return; }
    if (existingQuantities.includes(qty)) {
      setError(`A package with ${qty.toLocaleString()} units already exists in this section.`);
      return;
    }
    if (pkg.min > 0 && qty < pkg.min) {
      setError(`The service requires a minimum of ${pkg.min.toLocaleString()} units. Enter a quantity of at least ${pkg.min.toLocaleString()}.`);
      return;
    }
    if (pkg.max > 0 && qty > pkg.max) {
      setError(`The service allows a maximum of ${pkg.max.toLocaleString()} units. Enter a quantity no greater than ${pkg.max.toLocaleString()}.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.post<ServicePackage>(API_ENDPOINTS.ADMIN_SERVICE_PACKAGES, {
        service_type: pkg.service_type,
        package_type: pkg.package_type,
        quantity: qty,
        provider_id: pkg.provider_id,
        provider_service_id: pkg.provider_service_id,
        provider_service_name: pkg.provider_service_name,
        provider_name: pkg.provider_name,
        provider_rate: pkg.provider_rate,
        portal_rate: pkg.portal_rate,
        discount_type: pkg.discount_type,
        discount_value: pkg.discount_value,
        min: pkg.min,
        max: pkg.max,
        is_active: pkg.is_active,
        admin_note: pkg.admin_note,
        description: pkg.description,
        service_label: pkg.service_label,
        mode: pkg.mode,
        start_count_type: pkg.start_count_type,
      });

      let newPkg = res.data;

      for (const fb of pkg.fallbacks) {
        const fbRes = await api.post<ServicePackage>(
          `${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${newPkg.id}/fallbacks`,
          {
            provider_id: fb.provider_id,
            provider_service_id: fb.provider_service_id,
            provider_service_name: fb.provider_service_name,
            provider_name: fb.provider_name,
            provider_rate: fb.provider_rate,
            min: fb.min,
            max: fb.max,
            is_active: fb.is_active,
          },
        );
        newPkg = fbRes.data;
      }

      onSaved(newPkg);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to duplicate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Duplicate Package" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Copying from</p>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Quantity</span>
            <span className="font-medium">{pkg.quantity.toLocaleString()} units</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Provider</span>
            <span className="font-medium">{pkg.provider_name} · #{pkg.provider_service_id}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Portal rate</span>
            <span className="font-medium">${pkg.portal_rate.toFixed(4)}/1k</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Portal price</span>
            <span className="font-medium text-teal-700">${sourcePrice.toFixed(2)}</span>
          </div>
          {pkg.discount_type !== 'none' && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Discount</span>
              <span className="font-medium">
                {pkg.discount_type === 'fixed' ? `$${pkg.discount_value.toFixed(2)} off` : `${pkg.discount_value}% off`}
              </span>
            </div>
          )}
          {pkg.fallbacks.length > 0 && (
            <div className="flex justify-between text-xs text-gray-600">
              <span>Fallbacks</span>
              <span className="font-medium">{pkg.fallbacks.length} (will be copied)</span>
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>New quantity</label>
          <input
            type="number"
            min="1"
            autoFocus
            className={inputCls}
            placeholder="e.g. 500"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            All settings are copied — provider, portal rate, discount, and fallbacks. Only the quantity differs.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" className={cancelCls} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryCls} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Duplicate
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Delete confirm modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteModal = ({ label, onClose, onConfirm }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };
  return (
    <Modal title="Confirm deletion" onClose={onClose}>
      <p className="text-sm text-gray-700 mb-6">{label}</p>
      <div className="flex justify-end gap-2">
        <button className={cancelCls} onClick={onClose} disabled={deleting}>Cancel</button>
        <button
          onClick={handle}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
          Delete
        </button>
      </div>
    </Modal>
  );
};
