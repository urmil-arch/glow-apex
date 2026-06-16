import { useCallback, useEffect, useState } from 'react';
import { GitBranch, Save, X, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
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

interface PackageConfig {
  default_service_id: string;
  fallback_service_ids: string[];
}

interface CategoryEditState {
  value: PackageConfig;
  bulk: PackageConfig;
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
  accent: 'teal' | 'indigo' | 'gray';
  onRemove: () => void;
}

const ServiceDetailCard = ({ svc, badge, accent, onRemove }: ServiceDetailCardProps) => {
  const containerCls =
    accent === 'teal'
      ? 'bg-teal-50 border-teal-200'
      : accent === 'indigo'
      ? 'bg-indigo-50 border-indigo-200'
      : 'bg-gray-50 border-gray-200';
  const barCls =
    accent === 'teal' ? 'bg-teal-500' : accent === 'indigo' ? 'bg-indigo-500' : 'bg-gray-300';

  return (
    <div className={`p-3 rounded-lg border ${containerCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex-shrink-0 w-1.5 rounded-full self-stretch ${barCls}`} />
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
};

const ProviderConfigPage: React.FC = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<AdminServiceDetail[]>([]);
  const [editStates, setEditStates] = useState<Record<string, CategoryEditState>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, 'value' | 'bulk'>>({});
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
          value: {
            default_service_id: cfg?.value_default?.service_id ?? '',
            fallback_service_ids: cfg?.value_fallbacks?.map((f) => f.service_id) ?? [],
          },
          bulk: {
            default_service_id: cfg?.bulk_default?.service_id ?? '',
            fallback_service_ids: cfg?.bulk_fallbacks?.map((f) => f.service_id) ?? [],
          },
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

  const updatePackage = (
    categoryId: string,
    type: 'value' | 'bulk',
    update: Partial<PackageConfig>,
  ) => {
    setEditStates((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [type]: { ...prev[categoryId][type], ...update },
        isDirty: true,
        success: false,
        error: '',
      },
    }));
  };

  const setDefault = (categoryId: string, type: 'value' | 'bulk', serviceId: string) => {
    updatePackage(categoryId, type, { default_service_id: serviceId });
  };

  const clearDefault = (categoryId: string, type: 'value' | 'bulk') => {
    updatePackage(categoryId, type, { default_service_id: '' });
  };

  const addFallback = (categoryId: string, type: 'value' | 'bulk', serviceId: string) => {
    if (!serviceId) return;
    const pkg = editStates[categoryId][type];
    if (pkg.fallback_service_ids.includes(serviceId) || pkg.default_service_id === serviceId) return;
    updatePackage(categoryId, type, {
      fallback_service_ids: [...pkg.fallback_service_ids, serviceId],
    });
  };

  const removeFallback = (categoryId: string, type: 'value' | 'bulk', index: number) => {
    const pkg = editStates[categoryId][type];
    updatePackage(categoryId, type, {
      fallback_service_ids: pkg.fallback_service_ids.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (categoryId: string) => {
    const state = editStates[categoryId];
    if (!state.value.default_service_id) {
      updateState(categoryId, { error: 'Select a default service for Value Packages before saving.' });
      return;
    }
    updateState(categoryId, { isSaving: true, error: '', success: false });
    try {
      await api.put(`${API_ENDPOINTS.ADMIN_ROUTING_CONFIG}/${categoryId}`, {
        value_default_service_id: state.value.default_service_id,
        value_fallback_service_ids: state.value.fallback_service_ids,
        bulk_default_service_id: state.bulk.default_service_id,
        bulk_fallback_service_ids: state.bulk.fallback_service_ids,
      });
      updateState(categoryId, { isSaving: false, isDirty: false, success: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
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
        value: { default_service_id: '', fallback_service_ids: [] },
        bulk: { default_service_id: '', fallback_service_ids: [] },
      });
    } catch {
      updateState(categoryId, { isSaving: false, error: 'Failed to clear config.' });
    }
  };

  const getServiceById = (serviceId: string): AdminServiceDetail | undefined =>
    allServices.find((s) => s.id === serviceId);

  // excludeIds applies only within the current tab — same service is valid in the other tab.
  const getGroupedServices = (excludeIds: Set<string>): ServiceGroup[] => {
    const groups = new Map<string, AdminServiceDetail[]>();
    for (const svc of allServices) {
      if (!svc.is_active || excludeIds.has(svc.id)) continue;
      const cat = svc.category_name || 'Uncategorized';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(svc);
    }
    return Array.from(groups.entries()).map(([categoryName, services]) => ({
      categoryName,
      services,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (loadError) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{loadError}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50">
          <GitBranch className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Provider Configuration</h1>
          <p className="text-sm text-gray-500">
            Configure separate routing for value and bulk packages per category.
          </p>
        </div>
      </div>

      {FRONTEND_CATEGORIES.map((catName) => {
        const cat = dbCategories.find((c) => c.name === catName);

        if (!cat) {
          return (
            <div key={catName} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <h2 className="font-semibold text-gray-900">{catName}</h2>
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  Not in admin panel
                </span>
              </div>
              <p className="px-6 pb-4 text-sm text-gray-500">
                Create a category named exactly{' '}
                <span className="font-mono font-medium text-gray-800">"{catName}"</span> in the
                Services page to configure routing for this service type.
              </p>
            </div>
          );
        }

        const state = editStates[cat.id];
        if (!state) return null;

        const isOpen = expanded[cat.id] ?? false;
        const tab = activeTab[cat.id] ?? 'value';
        const pkg = state[tab];
        const accentColor: 'teal' | 'indigo' = tab === 'value' ? 'teal' : 'indigo';
        const defaultSvc = pkg.default_service_id ? getServiceById(pkg.default_service_id) : undefined;

        // Within-tab exclusions only
        const usedInTab = new Set([pkg.default_service_id, ...pkg.fallback_service_ids].filter(Boolean));
        const hasAnyConfig =
          state.value.default_service_id ||
          state.bulk.default_service_id ||
          state.value.fallback_service_ids.length > 0 ||
          state.bulk.fallback_service_ids.length > 0;

        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Collapsible header */}
            <button
              className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50/60 transition-colors"
              onClick={() => setExpanded((prev) => ({ ...prev, [cat.id]: !isOpen }))}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 flex-shrink-0">{cat.name}</h2>
                {state.value.default_service_id && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">
                    Value configured
                  </span>
                )}
                {state.bulk.default_service_id && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Bulk configured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {state.success && !state.isDirty && (
                  <span className="text-xs text-emerald-600 font-medium">Saved</span>
                )}
                {state.isDirty && (
                  <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">

                {/* Value / Bulk tab strip */}
                <div className="flex border-b border-gray-100">
                  {(['value', 'bulk'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab((prev) => ({ ...prev, [cat.id]: t }))}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        tab === t
                          ? t === 'value'
                            ? 'border-teal-500 text-teal-600'
                            : 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t === 'value' ? 'Value Packages' : 'Bulk Packages'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-6 space-y-6">
                  {/* Default service */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Default Service</p>
                    {defaultSvc ? (
                      <div className="mb-2">
                        <ServiceDetailCard
                          svc={defaultSvc}
                          accent={accentColor}
                          onRemove={() => clearDefault(cat.id, tab)}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mb-2">No default set</p>
                    )}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setDefault(cat.id, tab, e.target.value);
                      }}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    >
                      <option value="">
                        {defaultSvc ? 'Change default service...' : 'Select default service...'}
                      </option>
                      {getGroupedServices(new Set(pkg.fallback_service_ids)).map(
                        ({ categoryName, services }) => (
                          <optgroup key={categoryName} label={categoryName}>
                            {services.map((svc) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.name} | {svc.provider_name} | ID: {svc.provider_service_id} |
                                ${svc.rate}/1000 | Min: {svc.min} | Max: {svc.max}
                              </option>
                            ))}
                          </optgroup>
                        ),
                      )}
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
                    {pkg.fallback_service_ids.length === 0 ? (
                      <p className="text-sm text-gray-400 italic mb-2">No fallbacks configured</p>
                    ) : (
                      <div className="space-y-2 mb-2">
                        {pkg.fallback_service_ids.map((sid, idx) => {
                          const svc = getServiceById(sid);
                          if (!svc) {
                            return (
                              <div
                                key={`${sid}-${idx}`}
                                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                              >
                                <p className="text-sm text-red-500">
                                  Service not found (ID: {sid})
                                </p>
                                <button
                                  onClick={() => removeFallback(cat.id, tab, idx)}
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
                              onRemove={() => removeFallback(cat.id, tab, idx)}
                            />
                          );
                        })}
                      </div>
                    )}
                    {getGroupedServices(usedInTab).length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) addFallback(cat.id, tab, e.target.value);
                        }}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                      >
                        <option value="">Add fallback service...</option>
                        {getGroupedServices(usedInTab).map(({ categoryName, services }) => (
                          <optgroup key={categoryName} label={categoryName}>
                            {services.map((svc) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.name} | {svc.provider_name} | ID: {svc.provider_service_id} |
                                ${svc.rate}/1000 | Min: {svc.min} | Max: {svc.max}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                  {state.error && (
                    <p className="text-sm text-red-600 flex-1">{state.error}</p>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    {hasAnyConfig && !state.isDirty && (
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProviderConfigPage;
