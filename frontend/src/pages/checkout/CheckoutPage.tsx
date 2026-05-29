import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ExternalLink, Loader, PlayCircle } from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

const CheckoutPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { serviceOrder, clearServiceOrder, categoryOrder, clearCategoryOrder } = useOrderStore();
  const navigate = useNavigate();

  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(() => {
    if (categoryOrder) return categoryOrder.quantity;
    return serviceOrder?.min ?? 100;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceOrder && !categoryOrder) {
      navigate("/services", { replace: true });
    }
  }, [serviceOrder, categoryOrder, navigate]);

  if (!authLoading && !isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (!serviceOrder && !categoryOrder) return null;

  function extractError(err: unknown): string {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    return typeof detail === "string" ? detail : "Failed to place order. Please try again.";
  }

  async function handlePlaceOrder() {
    if (!link.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (categoryOrder) {
        await api.post(API_ENDPOINTS.ORDERS_BY_CATEGORY, {
          category_name: categoryOrder.categoryName,
          link: link.trim(),
          quantity: categoryOrder.quantity,
        });
        clearCategoryOrder();
      } else if (serviceOrder) {
        if (quantity < serviceOrder.min || quantity > serviceOrder.max) return;
        await api.post(API_ENDPOINTS.ORDERS, {
          service_id: serviceOrder.serviceId,
          link: link.trim(),
          quantity,
        });
        clearServiceOrder();
      }
      navigate("/dashboard/orders");
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  const isCategoryFlow = Boolean(categoryOrder);
  const serviceName = isCategoryFlow ? categoryOrder!.categoryName : serviceOrder!.serviceName;
  const description = isCategoryFlow ? "" : serviceOrder!.description;
  const displayQuantity = isCategoryFlow ? categoryOrder!.quantity : quantity;
  const min = isCategoryFlow ? 1 : serviceOrder!.min;
  const max = isCategoryFlow ? Infinity : serviceOrder!.max;
  const isValid = link.trim().length > 0 && (isCategoryFlow || (quantity >= min && quantity <= max));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Place Order</h1>
        <p className="text-sm text-gray-500 mb-8">
          Fill in the details below to submit your order.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: inputs */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-teal-500" />
                    YouTube Link
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>

              {/* Quantity — locked for category flow, editable for service flow */}
              {isCategoryFlow ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                  <div className="w-full text-sm border border-gray-100 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-700 font-medium">
                    {displayQuantity.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Min: {min.toLocaleString()} — Max: {max.toLocaleString()}
                  </p>
                  {quantity < min && (
                    <p className="text-xs text-red-500 mt-1">Minimum quantity is {min.toLocaleString()}</p>
                  )}
                  {quantity > max && (
                    <p className="text-xs text-red-500 mt-1">Maximum quantity is {max.toLocaleString()}</p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!isValid || loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>

          {/* Right: sticky summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-red-50 rounded-lg p-2">
                  <PlayCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Order Summary</p>
              </div>

              <p className="text-sm font-medium text-gray-900 mb-1">{serviceName}</p>
              {description && (
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{description}</p>
              )}

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Quantity</span>
                  <span>{displayQuantity.toLocaleString()}</span>
                </div>
                {!isCategoryFlow && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Rate</span>
                      <span>${serviceOrder!.rate.toFixed(3)} / 1k</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                      <span>Total</span>
                      <span>${((serviceOrder!.rate * quantity) / 1000).toFixed(4)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
