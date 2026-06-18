import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Film,
  GripVertical,
  Heart,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';
import {
  AddFallbackModal,
  AddQuantityModal,
  calcPrice,
  DeleteModal,
  DuplicateModal,
  type FallbackService,
  type Provider,
  type ProviderService,
  type ServicePackage,
} from './PackageModals';

// ── Hardcoded sections ────────────────────────────────────────────────────────

interface ServiceSection {
  key: string;
  label: string;
  description: string;
}

const SECTIONS: ServiceSection[] = [
  { key: 'youtube_views',        label: 'YouTube Views',        description: 'Video view count packages' },
  { key: 'youtube_likes',        label: 'YouTube Likes',        description: 'Video like count packages' },
  { key: 'youtube_subscribers',  label: 'YouTube Subscribers',  description: 'Channel subscriber packages' },
  { key: 'youtube_comments',     label: 'YouTube Comments',     description: 'Video comment packages' },
  { key: 'youtube_shorts_views', label: 'YouTube Shorts Views', description: 'Shorts video view packages' },
  { key: 'youtube_shorts_likes', label: 'YouTube Shorts Likes', description: 'Shorts video like packages' },
];

type SectionMeta = {
  Icon: React.FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  accent: string;
  ring: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  youtube_views:        { Icon: TrendingUp,   iconColor: 'text-blue-600',   iconBg: 'bg-blue-50',   accent: 'bg-blue-500',   ring: 'ring-blue-100' },
  youtube_likes:        { Icon: ThumbsUp,     iconColor: 'text-pink-600',   iconBg: 'bg-pink-50',   accent: 'bg-pink-500',   ring: 'ring-pink-100' },
  youtube_subscribers:  { Icon: Users,        iconColor: 'text-violet-600', iconBg: 'bg-violet-50', accent: 'bg-violet-500', ring: 'ring-violet-100' },
  youtube_comments:     { Icon: MessageSquare,iconColor: 'text-emerald-600',iconBg: 'bg-emerald-50',accent: 'bg-emerald-500',ring: 'ring-emerald-100' },
  youtube_shorts_views: { Icon: Film,         iconColor: 'text-orange-600', iconBg: 'bg-orange-50', accent: 'bg-orange-500', ring: 'ring-orange-100' },
  youtube_shorts_likes: { Icon: Heart,        iconColor: 'text-red-600',    iconBg: 'bg-red-50',    accent: 'bg-red-500',    ring: 'ring-red-100' },
};

// ── Service detail popup ──────────────────────────────────────────────────────

interface ServiceDetailPopupProps {
  entry: FallbackService;
  onClose: () => void;
}

const ServiceDetailPopup = ({ entry, onClose }: ServiceDetailPopupProps) => {
  const [data, setData] = useState<ProviderService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<ProviderService[]>(`${API_ENDPOINTS.ADMIN_PROVIDERS}/${entry.provider_id}/services`)
      .then((r) => {
        const svc = r.data.find((s) => s.service === entry.provider_service_id);
        if (svc) {
          setData(svc);
        } else {
          setError('Service not found in provider list.');
        }
      })
      .catch(() => setError('Failed to load service details.'))
      .finally(() => setLoading(false));
  }, [entry.provider_id, entry.provider_service_id]);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-gray-800 text-right">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Service Details</p>
            <p className="text-xs text-gray-400 mt-0.5">{entry.provider_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-1 pb-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-8">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching from provider…
            </div>
          )}
          {error && <p className="text-sm text-red-600 py-4 text-center">{error}</p>}
          {data && (
            <div>
              {row('Service ID', <span className="font-mono text-teal-700">#{data.service}</span>)}
              {row('Name', data.name)}
              {row('Type', <span className="capitalize">{data.type}</span>)}
              {row('Rate', <span className="font-mono text-orange-600">${data.rate} / 1 000</span>)}
              {row('Min order', <span className="font-mono">{parseInt(data.min).toLocaleString()}</span>)}
              {row('Max order', <span className="font-mono">{parseInt(data.max).toLocaleString()}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Combined routing list (default as item 0 + fallbacks) ────────────────────

interface RoutingListProps {
  pkg: ServicePackage;
  onUpdated: (p: ServicePackage) => void;
  onRequestDeleteFallback: (fallbackIdx: number) => void;
}

const buildRoutingEntries = (p: ServicePackage): FallbackService[] => [
  {
    provider_id: p.provider_id,
    provider_service_id: p.provider_service_id,
    provider_service_name: p.provider_service_name,
    provider_name: p.provider_name,
    provider_rate: p.provider_rate,
    min: p.min,
    max: p.max,
    is_active: true,
    description: p.description,
    service_label: p.service_label,
    mode: p.mode,
    start_count_type: p.start_count_type,
  },
  ...p.fallbacks,
];

const RoutingList = ({ pkg, onUpdated, onRequestDeleteFallback }: RoutingListProps) => {
  const [entries, setEntries] = useState<FallbackService[]>(() => buildRoutingEntries(pkg));
  const [saving, setSaving] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [viewEntry, setViewEntry] = useState<FallbackService | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  useEffect(() => { setEntries(buildRoutingEntries(pkg)); }, [pkg]);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragIdxRef.current = idx;
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const resetDrag = () => {
    dragIdxRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = async (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIdxRef.current;
    resetDrag();
    if (from === null || from === toIdx) return;

    const next = [...entries];
    const [moved] = next.splice(from, 1);
    next.splice(toIdx, 0, moved);
    setEntries(next);
    setSaving(true);
    try {
      const res = await api.put<ServicePackage>(
        `${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${pkg.id}/routing/reorder`,
        { entries: next },
      );
      onUpdated(res.data);
    } catch {
      setEntries(buildRoutingEntries(pkg));
    } finally {
      setSaving(false);
    }
  };

  const isDragging = draggingIdx !== null;

  return (
    <div className="space-y-1.5" onDragOver={(e) => e.preventDefault()}>
      {saving && (
        <p className="text-xs text-teal-600 flex items-center gap-1 mb-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving order…
        </p>
      )}
      {entries.map((entry, i) => {
        const isDefault = i === 0;
        const isSource = draggingIdx === i;
        const isTarget = isDragging && dragOverIdx === i && !isSource;
        return (
          <div key={`${entry.provider_id}-${entry.provider_service_id}-${i}`} className="relative">
            <div
              className={`absolute -top-0.5 left-0 right-0 h-0.5 rounded-full transition-opacity duration-100 ${
                isTarget ? 'bg-teal-500 opacity-100' : 'opacity-0'
              }`}
            />
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={resetDrag}
              className={`flex items-center gap-2 rounded-xl text-xs cursor-grab active:cursor-grabbing border transition-all duration-100 ${
                isDefault ? 'px-3 py-3' : 'px-2.5 py-2'
              } ${
                isSource
                  ? 'opacity-40 bg-gray-50 border-dashed border-gray-300 scale-[0.98]'
                  : isTarget
                  ? 'bg-teal-50 border-teal-400 shadow-sm'
                  : isDefault
                  ? 'bg-teal-50 border-teal-500 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-teal-300'
              }`}
            >
              <GripVertical
                className={`flex-shrink-0 pointer-events-none ${
                  isDefault ? 'h-4 w-4 text-teal-400' : 'h-3.5 w-3.5 text-gray-400'
                }`}
              />
              <span
                className={`flex-shrink-0 font-semibold rounded pointer-events-none ${
                  isDefault
                    ? 'bg-teal-600 text-white text-xs px-2 py-0.5'
                    : 'bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5'
                }`}
              >
                {isDefault ? 'Default' : `#${i}`}
              </span>
              <div className="flex-1 min-w-0 pointer-events-none">
                <span className={`${isDefault ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                  {entry.provider_name}
                </span>
                <span className={`mx-1 ${isDefault ? 'text-teal-300' : 'text-gray-400'}`}>·</span>
                <span className={`font-mono ${isDefault ? 'text-teal-600' : 'text-gray-500'}`}>
                  #{entry.provider_service_id}
                </span>
                <span className={`mx-1 ${isDefault ? 'text-teal-300' : 'text-gray-400'}`}>—</span>
                <span className={`truncate ${isDefault ? 'text-teal-800' : 'text-gray-600'}`}>
                  {entry.provider_service_name}
                </span>
              </div>
              <span
                className={`font-mono flex-shrink-0 pointer-events-none ${
                  isDefault ? 'text-orange-500 font-semibold' : 'text-orange-600'
                }`}
              >
                ${entry.provider_rate.toFixed(4)}/1k
              </span>
              {!isDefault && (
                <span
                  className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium pointer-events-none ${
                    entry.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {entry.is_active ? 'on' : 'off'}
                </span>
              )}
              <button
                onClick={() => setViewEntry(entry)}
                className="flex-shrink-0 text-gray-300 hover:text-teal-500 transition-colors"
                title="View provider details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              {!isDefault && (
                <button
                  onClick={() => onRequestDeleteFallback(i - 1)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      {viewEntry && (
        <ServiceDetailPopup entry={viewEntry} onClose={() => setViewEntry(null)} />
      )}
    </div>
  );
};

// ── Quantity row ──────────────────────────────────────────────────────────────

interface QuantityRowProps {
  pkg: ServicePackage;
  providers: Provider[];
  existingQuantities: number[];
  onUpdated: (p: ServicePackage) => void;
  onDeleted: (id: string) => void;
  onAdded: (p: ServicePackage) => void;
}

const QuantityRow = ({ pkg, providers, existingQuantities, onUpdated, onDeleted, onAdded }: QuantityRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [addFallback, setAddFallback] = useState(false);
  const [deleteFbIdx, setDeleteFbIdx] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { final: portalPrice } = calcPrice(
    pkg.quantity,
    pkg.portal_rate,
    pkg.discount_type,
    pkg.discount_value,
  );
  const providerCost = Math.round((pkg.quantity / 1000) * pkg.provider_rate * 10000) / 10000;

  const handleDeletePkg = async () => {
    await api.delete(`${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${pkg.id}`);
    onDeleted(pkg.id);
  };

  const handleDeleteFallback = async () => {
    if (deleteFbIdx === null) return;
    const res = await api.delete<ServicePackage>(
      `${API_ENDPOINTS.ADMIN_SERVICE_PACKAGES}/${pkg.id}/fallbacks/${deleteFbIdx}`,
    );
    onUpdated(res.data);
    setDeleteFbIdx(null);
  };

  return (
    <>
      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Row header */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Expand chevron */}
          <span className={`flex-shrink-0 transition-colors ${expanded ? 'text-teal-500' : 'text-gray-300'}`}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>

          {/* Quantity — large and bold */}
          <div className="flex-shrink-0 w-24">
            <p className="text-xl font-bold text-gray-900 leading-none">
              {pkg.quantity.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">units</p>
          </div>

          {/* Vertical rule */}
          <div className="h-9 w-px bg-gray-100 flex-shrink-0" />

          {/* Provider info — two lines */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
              {pkg.provider_name}
            </p>
            <p className="text-[11px] text-gray-400 font-mono truncate leading-snug">
              #{pkg.provider_service_id}
              {pkg.provider_service_name ? ` — ${pkg.provider_service_name}` : ''}
            </p>
          </div>

          {/* Pricing block */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="text-right hidden lg:block pr-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cost</p>
              <p className="text-xs font-mono text-orange-500 font-medium">${providerCost.toFixed(4)}</p>
            </div>
            <div className="h-7 w-px bg-gray-100 hidden lg:block mr-3" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
              <p className="text-base font-bold text-teal-600">${portalPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                pkg.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {pkg.is_active ? 'Active' : 'Off'}
            </span>
            {pkg.fallbacks.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-teal-50 text-teal-600">
                +{pkg.fallbacks.length}
              </span>
            )}
            {pkg.discount_type !== 'none' && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                {pkg.discount_type === 'fixed'
                  ? `-$${pkg.discount_value.toFixed(2)}`
                  : `-${pkg.discount_value}%`}
              </span>
            )}
          </div>

          {/* Action menu */}
          <div
            ref={menuRef}
            className="relative flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
                <button
                  onClick={() => { setEditOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => { setDuplicateOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expanded: routing + controls */}
        {expanded && (
          <div className="border-t border-gray-100 rounded-b-2xl overflow-hidden">
            <div className="bg-gray-50/80 px-5 py-4 space-y-3">
              {/* Routing header */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Routing order
                </p>
                <p className="text-[10px] text-gray-400">
                  Drag to reorder · index 0 is default
                </p>
              </div>

              <RoutingList
                pkg={pkg}
                onUpdated={onUpdated}
                onRequestDeleteFallback={(idx: number) => setDeleteFbIdx(idx)}
              />

              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <button
                  onClick={() => setAddFallback(true)}
                  className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:text-teal-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add fallback
                </button>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  {pkg.admin_note && (
                    <span className="italic truncate max-w-[200px]" title={pkg.admin_note}>
                      {pkg.admin_note}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editOpen && (
        <AddQuantityModal
          serviceType={pkg.service_type}
          packageType={pkg.package_type as 'value' | 'bulk'}
          serviceLabel={SECTIONS.find((s) => s.key === pkg.service_type)?.label ?? pkg.service_type}
          providers={providers}
          existing={pkg}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => { onUpdated(updated); setEditOpen(false); }}
        />
      )}
      {deleteOpen && (
        <DeleteModal
          label={`Delete ${pkg.quantity.toLocaleString()} unit quantity for this service? All fallbacks will be removed.`}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => { await handleDeletePkg(); setDeleteOpen(false); }}
        />
      )}
      {duplicateOpen && (
        <DuplicateModal
          pkg={pkg}
          existingQuantities={existingQuantities}
          onClose={() => setDuplicateOpen(false)}
          onSaved={(newPkg) => { onAdded(newPkg); setDuplicateOpen(false); }}
        />
      )}
      {addFallback && (
        <AddFallbackModal
          parent={pkg}
          providers={providers}
          onClose={() => setAddFallback(false)}
          onSaved={(updated) => { onUpdated(updated); setAddFallback(false); }}
        />
      )}
      {deleteFbIdx !== null && (
        <DeleteModal
          label={`Remove fallback #${deleteFbIdx + 1} from this quantity row?`}
          onClose={() => setDeleteFbIdx(null)}
          onConfirm={async () => { await handleDeleteFallback(); }}
        />
      )}
    </>
  );
};

// ── Section component ─────────────────────────────────────────────────────────

interface SectionProps {
  section: ServiceSection;
  packages: ServicePackage[];
  providers: Provider[];
  onUpdated: (p: ServicePackage) => void;
  onDeleted: (id: string) => void;
  onAdded: (p: ServicePackage) => void;
}

const Section = ({ section, packages, providers, onUpdated, onDeleted, onAdded }: SectionProps) => {
  const [tab, setTab] = useState<'value' | 'bulk'>('value');
  const [collapsed, setCollapsed] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const meta = SECTION_META[section.key] ?? SECTION_META.youtube_views;
  const { Icon } = meta;

  const allRows = packages.filter((p) => p.service_type === section.key);
  const valueCount = allRows.filter((p) => p.package_type === 'value').length;
  const bulkCount = allRows.filter((p) => p.package_type === 'bulk').length;
  const activeCount = allRows.filter((p) => p.is_active).length;
  const totalCount = allRows.length;

  const rows = allRows
    .filter((p) => p.package_type === tab)
    .sort((a, b) => a.priority - b.priority);

  const existingQuantities = rows.map((r) => r.quantity);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Thin colored accent bar */}
      <div className={`h-1 w-full ${meta.accent}`} />

      {/* Section header */}
      <div
        className="flex items-center justify-between px-6 py-5 cursor-pointer select-none"
        onClick={() => setCollapsed((v) => !v)}
      >
        {/* Left: icon + label + stats */}
        <div className="flex items-center gap-4">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconBg} ring-4 ${meta.ring}`}>
            <Icon className={`h-5 w-5 ${meta.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
              {totalCount > 0 && (
                <>
                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                    {valueCount}V
                  </span>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {bulkCount}B
                  </span>
                  {activeCount > 0 && (
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {activeCount} active
                    </span>
                  )}
                </>
              )}
              {totalCount === 0 && (
                <span className="text-[10px] text-gray-400">No packages yet</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
          </div>
        </div>

        {/* Right: tab switcher + chevron */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {(['value', 'bulk'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className={`transition-colors flex-shrink-0 ${collapsed ? 'text-gray-400' : 'text-teal-500'}`}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-3 bg-gray-50/40">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className={`h-14 w-14 rounded-2xl ${meta.iconBg} flex items-center justify-center mb-4 opacity-60`}>
                <Icon className={`h-7 w-7 ${meta.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-gray-500">No {tab} packages yet</p>
              <p className="text-xs text-gray-400 mt-1">Click below to add the first one</p>
            </div>
          ) : (
            rows.map((pkg) => (
              <QuantityRow
                key={pkg.id}
                pkg={pkg}
                providers={providers}
                existingQuantities={existingQuantities}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
                onAdded={onAdded}
              />
            ))
          )}

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors mt-1"
          >
            <Plus className="h-4 w-4" />
            Add {tab} quantity
          </button>
        </div>
      )}

      {addOpen && (
        <AddQuantityModal
          serviceType={section.key}
          packageType={tab}
          serviceLabel={section.label}
          providers={providers}
          existingQuantities={existingQuantities}
          onClose={() => setAddOpen(false)}
          onSaved={(pkg) => { onAdded(pkg); setAddOpen(false); }}
        />
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const ServicesPage = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgRes, provRes] = await Promise.all([
        api.get<ServicePackage[]>(API_ENDPOINTS.ADMIN_SERVICE_PACKAGES),
        api.get<Provider[]>(API_ENDPOINTS.ADMIN_PROVIDERS),
      ]);
      setPackages(pkgRes.data);
      setProviders(provRes.data);
    } catch {
      setError('Failed to load data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdated = (updated: ServicePackage) => {
    setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdded = (pkg: ServicePackage) => {
    setPackages((prev) => [...prev, pkg]);
  };

  const activeCount = packages.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage quantity packages, pricing, and fallback routing.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {!loading && !error && packages.length > 0 && (
            <>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-gray-900">{packages.length}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Active</p>
                <p className="text-xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
            </>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <p className="text-sm">Loading packages…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sections */}
      {!loading && !error && (
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <Section
              key={section.key}
              section={section}
              packages={packages}
              providers={providers}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onAdded={handleAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
