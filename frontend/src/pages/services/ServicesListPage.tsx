import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Loader, Package, Search, X } from "lucide-react";
import { useServices } from "@/context/ServicesContext";
import { useOrderStore } from "@/store/useOrderStore";
import { AdminService } from "@/types";

const ServicesListPage = () => {
  const { services, loading, error } = useServices();
  const { setServiceOrder } = useOrderStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>(
    () => searchParams.get("category") ?? "All"
  );
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const names = Array.from(new Set(services.map((s) => s.category_name)));
    return names.sort();
  }, [services]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cats = activeCategory === "All" ? categories : [activeCategory];

    return cats
      .map((cat) => {
        let items = services.filter((s) => s.category_name === cat);
        if (q) {
          items = items.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.type.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q)
          );
        }
        return { category: cat, items };
      })
      .filter((g) => g.items.length > 0);
  }, [services, categories, activeCategory, search]);

  const totalVisible = useMemo(
    () => grouped.reduce((sum, g) => sum + g.items.length, 0),
    [grouped]
  );

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleOrderNow(service: AdminService) {
    setServiceOrder({
      serviceId: service.id,
      serviceName: service.name,
      description: service.description,
      rate: service.rate,
      min: service.min,
      max: service.max,
    });
    navigate("/checkout");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 pt-32 pb-12 px-4 text-center text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Services</h1>
        <p className="text-teal-100 text-base md:text-lg max-w-xl mx-auto mb-8">
          Real engagement from real users. Pick a service and start growing today.
        </p>

        {/* Search */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl text-sm text-gray-800 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === "All"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {search.trim() && !loading && (
          <p className="text-sm text-gray-500 mb-5">
            {totalVisible} result{totalVisible !== 1 ? "s" : ""} for{" "}
            <span className="font-medium text-gray-800">"{search}"</span>
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {/* Empty */}
        {!loading && !error && grouped.length === 0 && (
          <div className="text-center py-24">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium mb-1">No services found</p>
            {search && (
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="text-xs text-teal-500 hover:underline mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Grouped list */}
        {!loading && !error && grouped.length > 0 && (
          <div className="space-y-4">
            {grouped.map(({ category, items }) => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">{category}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        {items.length} service{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    }
                  </button>

                  {/* Service rows */}
                  {!isCollapsed && (
                    <div className="border-t border-gray-100">
                      {/* Table header — hidden on mobile */}
                      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <span>Service</span>
                        <span className="text-right w-20">Rate / 1k</span>
                        <span className="text-right w-28">Min – Max</span>
                        <span className="w-24"></span>
                      </div>

                      <div className="divide-y divide-gray-50">
                        {items.map((service) => (
                          <div
                            key={service.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-3 hover:bg-gray-50/60 transition-colors"
                          >
                            {/* Name + badges */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs text-gray-400 font-mono">#{service.id.slice(-6)}</span>
                                {service.type && service.type !== "Default" && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-600 leading-none">
                                    {service.type}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800 leading-snug">{service.name}</p>
                              {service.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
                              )}
                            </div>

                            {/* Rate */}
                            <div className="sm:text-right sm:w-20">
                              <span className="text-xs text-gray-400 sm:hidden">Rate: </span>
                              <span className="text-sm font-semibold text-gray-900">${service.rate.toFixed(3)}</span>
                              <span className="text-xs text-gray-400"> /1k</span>
                            </div>

                            {/* Min–Max */}
                            <div className="sm:text-right sm:w-28">
                              <span className="text-xs text-gray-400 sm:hidden">Range: </span>
                              <span className="text-xs text-gray-500">
                                {service.min.toLocaleString()} – {service.max.toLocaleString()}
                              </span>
                            </div>

                            {/* CTA */}
                            <div className="sm:w-24">
                              <button
                                onClick={() => handleOrderNow(service)}
                                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                              >
                                Order Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesListPage;
