import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { CreditCard, ExternalLink, Loader, PlayCircle, Zap } from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuth } from "@/context/AuthContext";
import { useServices } from "@/context/ServicesContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

// Razorpay is loaded via <script> in index.html — declare the global
declare const Razorpay: new (options: Record<string, unknown>) => { open(): void };

interface StripeInitiateResponse {
  order_id: string;
  checkout_url: string;
  session_id: string;
  charge: number;
  currency: string;
}

interface RazorpayCreateResponse {
  order_id: string;
  razorpay_order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  description: string;
}

type PaymentMethod = "stripe" | "razorpay";

const CheckoutPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { services } = useServices();
  const { serviceOrder, clearServiceOrder, categoryOrder, clearCategoryOrder } = useOrderStore();
  const navigate = useNavigate();

  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(() => {
    if (categoryOrder) return categoryOrder.quantity;
    return serviceOrder?.min ?? 100;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
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

  function buildOrderBody(): Record<string, string | number> {
    const body: Record<string, string | number> = {
      link: link.trim(),
      quantity: isCategoryFlow ? categoryOrder!.quantity : quantity,
    };
    if (isCategoryFlow) {
      body.category_name = categoryOrder!.categoryName;
    } else {
      body.service_id = serviceOrder!.serviceId;
    }
    return body;
  }

  async function handleStripe() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<StripeInitiateResponse>(
        API_ENDPOINTS.ORDERS_STRIPE_INITIATE,
        buildOrderBody(),
      );
      window.location.href = res.data.checkout_url;
    } catch (err: unknown) {
      setError(extractError(err));
      setLoading(false);
    }
  }

  async function handleRazorpay() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<RazorpayCreateResponse>(
        API_ENDPOINTS.RAZORPAY_CREATE,
        buildOrderBody(),
      );
      const { order_id, razorpay_order_id, key_id, amount, currency, description } = res.data;

      const options: Record<string, unknown> = {
        key: key_id,
        amount,
        currency,
        name: "BuyRealViews",
        description,
        order_id: razorpay_order_id,
        prefill: {
          name: user?.full_name ?? "",
          email: user?.email ?? "",
          method: "upi",
          vpa: "",
        },
        theme: { color: "#0d9488" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.post(API_ENDPOINTS.RAZORPAY_VERIFY, {
              order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            isCategoryFlow ? clearCategoryOrder() : clearServiceOrder();
            navigate("/dashboard/orders");
          } catch (verifyErr: unknown) {
            setError(extractError(verifyErr));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setError(extractError(err));
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!link.trim()) return;
    if (!isCategoryFlow && (quantity < serviceOrder!.min || quantity > serviceOrder!.max)) return;
    if (paymentMethod === "razorpay") {
      await handleRazorpay();
    } else {
      await handleStripe();
    }
  }

  const isCategoryFlow = Boolean(categoryOrder);
  const serviceName = isCategoryFlow ? categoryOrder!.categoryName : serviceOrder!.serviceName;
  const description = isCategoryFlow ? "" : serviceOrder!.description;
  const displayQuantity = isCategoryFlow ? categoryOrder!.quantity : quantity;
  const min = isCategoryFlow ? 1 : serviceOrder!.min;
  const max = isCategoryFlow ? Infinity : serviceOrder!.max;
  const isValid = link.trim().length > 0 && (isCategoryFlow || (quantity >= min && quantity <= max));

  const activeRate = isCategoryFlow
    ? (services.find(s => s.default_for_category === categoryOrder!.categoryName)?.rate ?? 0)
    : serviceOrder!.rate;
  const rawCharge = (activeRate * displayQuantity) / 1000;
  const finalCharge = Math.max(rawCharge, 0.50);

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

              {/* Quantity */}
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
                  {quantity < min && <p className="text-xs text-red-500 mt-1">Minimum quantity is {min.toLocaleString()}</p>}
                  {quantity > max && <p className="text-xs text-red-500 mt-1">Maximum quantity is {max.toLocaleString()}</p>}
                </div>
              )}

              {/* Payment method selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["stripe", "razorpay"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === m
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {m === "stripe"
                        ? <><CreditCard className="w-4 h-4" /> Stripe</>
                        : <><Zap className="w-4 h-4" /> Razorpay</>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {paymentMethod === "stripe"
                    ? "Pay with card via Stripe (USD)"
                    : "Pay with UPI / card via Razorpay (INR)"}
                </p>
              </div>

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
                    {paymentMethod === "razorpay" ? "Opening Payment..." : "Redirecting to Payment..."}
                  </>
                ) : (
                  paymentMethod === "razorpay" ? "Pay with Razorpay" : "Pay with Stripe"
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
                {activeRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Rate</span>
                    <span>${activeRate.toFixed(3)} / 1k</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                  <span>Total (USD)</span>
                  <span>${finalCharge.toFixed(4)}</span>
                </div>
                {paymentMethod === "razorpay" && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>≈ INR</span>
                    <span>₹{(finalCharge * 83).toFixed(2)}</span>
                  </div>
                )}
                {rawCharge < 0.50 && activeRate > 0 && (
                  <p className="text-xs text-amber-600 mt-1">$0.50 minimum charge applied.</p>
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
