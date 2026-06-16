import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, DollarSign, ToggleLeft, ToggleRight, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LocalPackage {
  quantity: number;
  discount_type: "none" | "fixed" | "percentage";
  discount_value: number;
  is_active: boolean;
}

interface LocalConfig {
  display_name: string;
  price_per_1000: number;
  value_packages: LocalPackage[];
  bulk_packages: LocalPackage[];
  is_active: boolean;
}

type PackageListType = "value" | "bulk";

// ── Constants ──────────────────────────────────────────────────────────────────

const SERVICE_CONFIGS: { service_type: string; display_name: string }[] = [
  { service_type: "youtube_views",                display_name: "YouTube Views" },
  { service_type: "youtube_likes",                display_name: "YouTube Likes" },
  { service_type: "youtube_subscribers",          display_name: "YouTube Subscribers" },
  { service_type: "youtube_comments",             display_name: "YouTube Comments" },
  { service_type: "youtube_shorts_views",         display_name: "YouTube Shorts Views" },
  { service_type: "youtube_shorts_likes",         display_name: "YouTube Shorts Likes" },
  { service_type: "country_targeted_subscribers", display_name: "Country Targeted Subscribers" },
];

const CATEGORY_TO_SERVICE_TYPE: Record<string, string> = {
  "YouTube Views":                "youtube_views",
  "YouTube Likes":                "youtube_likes",
  "YouTube Subscribers":          "youtube_subscribers",
  "YouTube Comments":             "youtube_comments",
  "YouTube Shorts Views":         "youtube_shorts_views",
  "YouTube Shorts Likes":         "youtube_shorts_likes",
  "Country Targeted Subscribers": "country_targeted_subscribers",
};

interface ServiceMinMax { min: number; max: number; }

const emptyConfig = (displayName: string): LocalConfig => ({
  display_name: displayName,
  price_per_1000: 0,
  value_packages: [],
  bulk_packages: [],
  is_active: true,
});

// ── Price calculation ─────────────────────────────────────────────────────────

function calcPrice(config: LocalConfig, pkg: LocalPackage): number {
  const base = (pkg.quantity / 1000) * config.price_per_1000;
  if (pkg.discount_type === "fixed")      return Math.max(0, base - pkg.discount_value);
  if (pkg.discount_type === "percentage") return Math.max(0, base * (1 - pkg.discount_value / 100));
  return base;
}

// ── Package list sub-component ────────────────────────────────────────────────

interface PackageListProps {
  label: string;
  packages: LocalPackage[];
  config: LocalConfig;
  minQty?: number;
  maxQty?: number;
  allQuantities: number[];   // quantities already used across both lists
  onUpdate: (idx: number, patch: Partial<LocalPackage>) => void;
  onRemove: (idx: number) => void;
  onAdd: (qty: number) => void;
}

const PackageList: React.FC<PackageListProps> = ({
  label, packages, config, minQty, maxQty, allQuantities,
  onUpdate, onRemove, onAdd,
}) => {
  const [newQty, setNewQty]     = useState("");
  const [qtyError, setQtyError] = useState("");

  const handleAdd = () => {
    const qty = parseInt(newQty, 10);
    if (!qty || qty < 1)                         { setQtyError("Enter a valid quantity."); return; }
    if (minQty !== undefined && qty < minQty)     { setQtyError(`Minimum is ${minQty.toLocaleString()}.`); return; }
    if (maxQty !== undefined && qty > maxQty)     { setQtyError(`Maximum is ${maxQty.toLocaleString()}.`); return; }
    if (allQuantities.includes(qty))              { setQtyError("This quantity already exists."); return; }
    setQtyError("");
    onAdd(qty);
    setNewQty("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          label === "Value" ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"
        }`}>
          {label} Packages
        </span>
        <span className="text-xs text-gray-400">{packages.filter(p => p.is_active).length} active</span>
      </div>

      {packages.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No {label.toLowerCase()} packages yet.</p>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Qty</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Discount</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Value</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Final Price</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">On</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg, idx) => {
                const finalPrice = calcPrice(config, pkg);
                return (
                  <tr key={pkg.quantity} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                      {pkg.quantity.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={pkg.discount_type}
                        onChange={(e) => onUpdate(idx, {
                          discount_type: e.target.value as LocalPackage["discount_type"],
                          discount_value: 0,
                        })}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="none">None</option>
                        <option value="fixed">Fixed ($)</option>
                        <option value="percentage">% Off</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {pkg.discount_type !== "none" ? (
                        <div className="relative w-20">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            {pkg.discount_type === "fixed" ? "$" : "%"}
                          </span>
                          <input
                            type="number" min="0" step="0.01"
                            value={pkg.discount_value || ""}
                            onChange={(e) => onUpdate(idx, { discount_value: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-5 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-semibold text-sm ${finalPrice > 0 ? "text-teal-700" : "text-gray-400"}`}>
                        ${finalPrice.toFixed(2)}
                      </span>
                      {pkg.discount_type !== "none" && config.price_per_1000 > 0 && (
                        <span className="text-xs text-gray-400 ml-1 line-through">
                          ${((pkg.quantity / 1000) * config.price_per_1000).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox" checked={pkg.is_active}
                        onChange={(e) => onUpdate(idx, { is_active: e.target.checked })}
                        className="accent-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => onRemove(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add row */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={minQty ?? 1}
            max={maxQty}
            value={newQty}
            onChange={(e) => { setNewQty(e.target.value); setQtyError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={`Add ${label.toLowerCase()} qty…`}
            className={`text-sm border rounded-lg px-3 py-2 w-44 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              qtyError ? "border-red-400" : "border-gray-300"
            }`}
          />
          <button
            onClick={handleAdd}
            disabled={!newQty}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 rounded-lg hover:bg-teal-100 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {qtyError && <p className="text-xs text-red-500">{qtyError}</p>}
        {(minQty !== undefined || maxQty !== undefined) && !qtyError && (
          <p className="text-xs text-gray-400">
            Valid range: {minQty !== undefined ? minQty.toLocaleString() : "—"} – {maxQty !== undefined ? maxQty.toLocaleString() : "—"}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Service card ───────────────────────────────────────────────────────────────

interface ServiceCardProps {
  serviceType: string;
  initial: LocalConfig;
  minQty?: number;
  maxQty?: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ serviceType, initial, minQty, maxQty }) => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [config, setConfig] = useState<LocalConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const set = (patch: Partial<LocalConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const updatePkg = (type: PackageListType, idx: number, patch: Partial<LocalPackage>) =>
    setConfig((c) => ({
      ...c,
      [`${type}_packages`]: c[`${type}_packages`].map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));

  const removePkg = (type: PackageListType, idx: number) =>
    setConfig((c) => ({
      ...c,
      [`${type}_packages`]: c[`${type}_packages`].filter((_, i) => i !== idx),
    }));

  const addPkg = (type: PackageListType, qty: number) =>
    setConfig((c) => ({
      ...c,
      [`${type}_packages`]: [
        ...c[`${type}_packages`],
        { quantity: qty, discount_type: "none", discount_value: 0, is_active: true },
      ].sort((a, b) => a.quantity - b.quantity),
    }));

  const allQuantities = [
    ...config.value_packages.map((p) => p.quantity),
    ...config.bulk_packages.map((p) => p.quantity),
  ];

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.put(`${API_ENDPOINTS.ADMIN_PRICING}/${serviceType}`, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border transition-colors ${isOpen ? "border-teal-200" : "border-gray-200"}`}>
      {/* Clickable header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          {isOpen
            ? <ChevronDown className="w-4 h-4 text-teal-500 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{config.display_name}</h2>
            {!isOpen && config.price_per_1000 > 0 && (
              <p className="text-xs text-gray-400">
                ${config.price_per_1000}/1k ·{" "}
                {config.value_packages.filter((p) => p.is_active).length} value,{" "}
                {config.bulk_packages.filter((p) => p.is_active).length} bulk active
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => set({ is_active: !config.is_active })}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              config.is_active
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : "border-gray-200 bg-gray-50 text-gray-400"
            }`}
          >
            {config.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {config.is_active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {isOpen && (
      <div className="px-5 pb-5 space-y-5 border-t border-gray-100">

      {/* Price per 1000 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price per 1,000 (USD)</label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number" min="0" step="0.01"
            value={config.price_per_1000 || ""}
            onChange={(e) => set({ price_per_1000: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {config.price_per_1000 > 0 && (
          <p className="text-xs text-gray-400 mt-1">= ${(config.price_per_1000 / 1000).toFixed(4)} per unit</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Value packages */}
      <PackageList
        label="Value"
        packages={config.value_packages}
        config={config}
        minQty={minQty}
        maxQty={maxQty}
        allQuantities={allQuantities}
        onUpdate={(idx, patch) => updatePkg("value", idx, patch)}
        onRemove={(idx) => removePkg("value", idx)}
        onAdd={(qty) => addPkg("value", qty)}
      />

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Bulk packages */}
      <PackageList
        label="Bulk"
        packages={config.bulk_packages}
        config={config}
        minQty={minQty}
        maxQty={maxQty}
        allQuantities={allQuantities}
        onUpdate={(idx, patch) => updatePkg("bulk", idx, patch)}
        onRemove={(idx) => removePkg("bulk", idx)}
        onAdd={(qty) => addPkg("bulk", qty)}
      />

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          {config.value_packages.filter((p) => p.is_active).length} value ·{" "}
          {config.bulk_packages.filter((p) => p.is_active).length} bulk active
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {saved && <p className="text-xs text-teal-600">Saved!</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const PricingPage: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, LocalConfig>>({});
  const [minMax, setMinMax]   = useState<Record<string, ServiceMinMax>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ service_type: string; display_name: string; price_per_1000: number; value_packages: LocalPackage[]; bulk_packages: LocalPackage[]; is_active: boolean }[]>(
        API_ENDPOINTS.ADMIN_PRICING,
      ),
      api.get<{ category_name: string; value_default: { min: number; max: number } | null }[]>(
        API_ENDPOINTS.ADMIN_ROUTING_CONFIG,
      ),
    ])
      .then(([pricingRes, routingRes]) => {
        const configMap: Record<string, LocalConfig> = {};
        pricingRes.data.forEach((d) => { configMap[d.service_type] = d; });
        setConfigs(configMap);

        const mmMap: Record<string, ServiceMinMax> = {};
        routingRes.data.forEach((r) => {
          const st = CATEGORY_TO_SERVICE_TYPE[r.category_name];
          if (st && r.value_default) mmMap[st] = { min: r.value_default.min, max: r.value_default.max };
        });
        setMinMax(mmMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pricing Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set the price per 1,000 units and configure <strong>Value</strong> and <strong>Bulk</strong> packages for each service. Prices are calculated automatically.
        </p>
      </div>

      {SERVICE_CONFIGS.map(({ service_type, display_name }) => (
        <ServiceCard
          key={service_type}
          serviceType={service_type}
          initial={configs[service_type] ?? emptyConfig(display_name)}
          minQty={minMax[service_type]?.min}
          maxQty={minMax[service_type]?.max}
        />
      ))}
    </div>
  );
};

export default PricingPage;
