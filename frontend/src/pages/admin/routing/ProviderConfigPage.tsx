import { useCallback, useEffect, useState } from 'react';
import { GitBranch, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';
import type { RoutingConfig } from '@/types';

// These are the only categories that the frontend hero pages ever order from.
// Must stay in sync with serviceTitles in service-selection-component.tsx.
const FRONTEND_CATEGORIES = [
  'YouTube Likes',
  'YouTube Views',
  'YouTube Comments',
  'YouTube Subscribers',
  'YouTube Shorts Likes',
  'YouTube Shorts Views',
] as const;

interface AdminServiceDetail {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  provider_id: string;
  provider_name: string;
  provider_service_id: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface CategoryEditState {
  default_service_id: string;
  fallback_service_ids: string[];
  isDirty: boolean;
  isSaving: boolean;
  error: string;
  success: boolean;
}

interface ServiceGroup {
  categoryName: string;
  services: AdminServiceDetail[];
}

interface ServiceDetailCardProps {
  svc: AdminServiceDetail;
  badge?: React.ReactNode;
  accent: 'teal' | 'gray';
  onRemove: () => void;
}

const ServiceDetailCard = ({ svc, badge, accent, onRemove }: ServiceDetailCardProps) => (
  <div
    className={`p-3 rounded-lg border ${
      accent === 'teal' ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`flex-shrink-0 w-1.5 rounded-full self-stretch ${
            accent === 'teal' ? 'bg-teal-500' : 'bg-gray-300'
          }`}
        />
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {badge}
            <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <span className="text-gray-400">Category:</span> {svc.category_name || '—'}
            </span>
            <span>
              <span className="text-gray-400">Provider:</span> {svc.provider_name || '—'}
            </span>
            <span>
              <span className="text-gray-400">Service ID:</span> {svc.provider_service_id}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>
              <span className="text-gray-400">Rate:</span> ${svc.rate}/1000
            </span>
            <span>
              <span className="text-gray-400">Min:</span> {svc.min.toLocaleString()}
            </span>
            <span>
              <span className="text-gray-400">Max:</span> {svc.max.toLocaleString()}
            </span>
            <span>
              <span className="text-gray-400">Type:</span> {svc.type || 'Default'}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const ProviderConfigPage: React.FC = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<AdminServiceDetail[]>([]);
  const [editStates, setEditStates] = useState<Record<string, CategoryEditState>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [catsRes, svcsRes, configsRes] = await Promise.all([
        api.get<Category[]>(API_ENDPOINTS.ADMIN_CATEGORIES),
        api.get<AdminServiceDetail[]>(API_ENDPOINTS.ADMIN_SERVICES),
        api.get<RoutingConfig[]>(API_ENDPOINTS.ADMIN_ROUTING_CONFIG),
      ]);

      const cats = catsRes.data;
      const svcs = svcsRes.data;
      const configs = configsRes.data;

      setDbCategories(cats);
      setAllServices(svcs);

      const configMap: Record<string, RoutingConfig> = {};
      for (const cfg of configs) {
        configMap[cfg.category_id] = cfg;
      }

      const initial: Record<string, CategoryEditState> = {};
      for (const name of FRONTEND_CATEGORIES) {
        const cat = cats.find((c) => c.name === name);
        if (!cat) continue;
        const cfg = configMap[cat.id];
        initial[cat.id] = {
          default_service_id: cfg?.default?.service_id ?? '',
          fallback_service_ids: cfg?.fallbacks.map((f) => f.service_id) ?? [],
          isDirty: false,
          isSaving: false,
          error: '',
          success: false,
        };
      }
      setEditStates(initial);
    } catch {
      setLoadError('Failed to load data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateState = (categoryId: string, update: Partial<CategoryEditState>) => {
    setEditStates((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], ...update },
    }));
  };

  const setDefault = (categoryId: string, serviceId: string) => {
    updateState(categoryId, { default_service_id: serviceId, isDirty: true, success: false, error: '' });
  };

  const addFallback = (categoryId: string, serviceId: string) => {
    if (!serviceId) return;
    const current = editStates[categoryId];
    if (current.fallback_service_ids.includes(serviceId) || current.default_service_id === serviceId) return;
    updateState(categoryId, {
      fallback_service_ids: [...current.fallback_service_ids, serviceId],
      isDirty: true,
      success: false,
      error: '',
    });
  };

  const removeFallback = (categoryId: string, index: number) => {
    const current = editStates[categoryId];
    const updated = current.fallback_service_ids.filter((_, i) => i !== index);
    updateState(categoryId, { fallback_service_ids: updated, isDirty: true, success: false, error: '' });
  };

  const clearDefault = (categoryId: string) => {
    updateState(categoryId, { default_service_id: '', isDirty: true, success: false, error: '' });
  };

  const handleSave = async (categoryId: string) => {
    const state = editStates[categoryId];
    if (!state.default_service_id) {
      updateState(categoryId, { error: 'Select a default service before saving.' });
      return;
    }
    updateState(categoryId, { isSaving: true, error: '', success: false });
    try {
      await api.put(`${API_ENDPOINTS.ADMIN_ROUTING_CONFIG}/${categoryId}`, {
        default_service_id: state.default_service_id,
        fallback_service_ids: state.fallback_service_ids,
      });
      updateState(categoryId, { isSaving: false, isDirty: false, success: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      updateState(categoryId, { isSaving: false, error: detail ?? 'Save failed. Please try again.' });
    }
  };

  const handleClearConfig = async (categoryId: string) => {
    updateState(categoryId, { isSaving: true, error: '', success: false });
    try {
      await api.delete(`${API_ENDPOINTS.ADMIN_ROUTING_CONFIG}/${categoryId}`);
      updateState(categoryId, {
        isSaving: false,
        isDirty: false,
        success: true,
        default_service_id: '',
        fallback_service_ids: [],
      });
    } catch {
      updateState(categoryId, { isSaving: false, error: 'Failed to clear config.' });
    }
  };

  const getServiceById = (serviceId: string): AdminServiceDetail | undefined =>
    allServices.find((s) => s.id === serviceId);

  const getGroupedServices = (excludeIds: Set<string>): ServiceGroup[] => {
    const groups = new Map<string, AdminServiceDetail[]>();
    for (const svc of allServices) {
      if (!svc.is_active || excludeIds.has(svc.id)) continue;
      const cat = svc.category_name || 'Uncategorized';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(svc);
    }
    return Array.from(groups.entries()).map(([categoryName, services]) => ({ categoryName, services }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{loadError}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50">
          <GitBranch className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Provider Configuration</h1>
          <p className="text-sm text-gray-500">
            Set a default and fallback service per category. Orders try the default first, then fallbacks in order.
          </p>
        </div>
      </div>

      {FRONTEND_CATEGORIES.map((catName) => {
        const cat = dbCategories.find((c) => c.name === catName);

        if (!cat) {
          return (
            <div key={catName} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900">{catName}</h2>
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Not in admin panel
                </span>
              </div>
              <p className="px-6 py-4 text-sm text-gray-500">
                Create a category named exactly <span className="font-mono font-medium text-gray-800">"{catName}"</span> in
                the Services page to configure routing for this service type.
              </p>
            </div>
          );
        }

        const state = editStates[cat.id];
        if (!state) return null;

        const defaultSvc = state.default_service_id ? getServiceById(state.default_service_id) : undefined;
        const usedIds = new Set([state.default_service_id, ...state.fallback_service_ids].filter(Boolean));
        const availableGroups = getGroupedServices(usedIds);

        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-gray-900">{cat.name}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                {state.success && !state.isDirty && (
                  <span className="text-xs text-emerald-600 font-medium">Saved</span>
                )}
                {state.isDirty && (
                  <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
                )}
                {(state.default_service_id || state.fallback_service_ids.length > 0) && !state.isDirty && (
                  <button
                    onClick={() => handleClearConfig(cat.id)}
                    disabled={state.isSaving}
                    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    Clear Config
                  </button>
                )}
                <button
                  onClick={() => handleSave(cat.id)}
                  disabled={!state.isDirty || state.isSaving}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-teal-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-700 transition-colors"
                >
                  {state.isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {state.error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
              )}

              {/* Default service */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Default Service</p>

                {defaultSvc ? (
                  <div className="mb-2">
                    <ServiceDetailCard
                      svc={defaultSvc}
                      accent="teal"
                      onRemove={() => clearDefault(cat.id)}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-2">No default set</p>
                )}

                <select
                  value=""
                  onChange={(e) => { if (e.target.value) setDefault(cat.id, e.target.value); }}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  <option value="">
                    {defaultSvc ? 'Change default service...' : 'Select default service...'}
                  </option>
                  {getGroupedServices(new Set(state.fallback_service_ids)).map(({ categoryName, services }) => (
                    <optgroup key={categoryName} label={categoryName}>
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} | {svc.provider_name} | ID: {svc.provider_service_id} | ${svc.rate}/1000 | Min: {svc.min} | Max: {svc.max}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Fallback services */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Fallback Services
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    (tried in order if the default fails)
                  </span>
                </p>

                {state.fallback_service_ids.length === 0 ? (
                  <p className="text-sm text-gray-400 italic mb-2">No fallbacks configured</p>
                ) : (
                  <div className="space-y-2 mb-2">
                    {state.fallback_service_ids.map((sid, idx) => {
                      const svc = getServiceById(sid);
                      if (!svc) {
                        return (
                          <div
                            key={`${sid}-${idx}`}
                            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <p className="text-sm text-red-500">Service not found (ID: {sid})</p>
                            <button
                              onClick={() => removeFallback(cat.id, idx)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      }
                      return (
                        <ServiceDetailCard
                          key={`${sid}-${idx}`}
                          svc={svc}
                          accent="gray"
                          badge={
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium">
                              {idx + 1}
                            </span>
                          }
                          onRemove={() => removeFallback(cat.id, idx)}
                        />
                      );
                    })}
                  </div>
                )}

                {availableGroups.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) addFallback(cat.id, e.target.value); }}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  >
                    <option value="">Add fallback service...</option>
                    {availableGroups.map(({ categoryName, services }) => (
                      <optgroup key={categoryName} label={categoryName}>
                        {services.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} | {svc.provider_name} | ID: {svc.provider_service_id} | ${svc.rate}/1000 | Min: {svc.min} | Max: {svc.max}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProviderConfigPage;
