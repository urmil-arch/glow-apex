import { useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  ArrowLeft, Check, CreditCard, ExternalLink,
  Loader, Lock, PlayCircle, ShieldCheck, Zap,
} from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuth } from "@/context/AuthContext";
import { useServices } from "@/context/ServicesContext";
import { usePricing, calcPackagePrice } from "@/context/PricingContext";
import { useCurrency } from "@/context/CurrencyContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

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

interface PackageOption {
  key: string;
  quantity: number;
  packageType: "value" | "bulk";
  price: number;
  discountLabel?: string;
}

type PaymentMethod = "stripe" | "razorpay";

const CATEGORY_TO_SERVICE_TYPE: Record<string, string> = {
  "YouTube Views":                "youtube_views",
  "YouTube Likes":                "youtube_likes",
  "YouTube Subscribers":          "youtube_subscribers",
  "YouTube Comments":             "youtube_comments",
  "YouTube Shorts Views":         "youtube_shorts_views",
  "YouTube Shorts Likes":         "youtube_shorts_likes",
  "Country Targeted Subscribers": "country_targeted_subscribers",
};

function buildDiscountLabel(
  discountType: string,
  discountValue: number,
  fmtAmount: (v: number) => string,
): string | undefined {
  if (discountType === "percentage") return `${discountValue}% OFF`;
  if (discountType === "fixed") return `${fmtAmount(discountValue)} OFF`;
  return undefined;
}

// ── Step header ────────────────────────────────────────────────────────────────

const StepHeader: React.FC<{ num: number; label: string }> = ({ num, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {num}
    </div>
    <p className="text-sm font-semibold text-gray-800">{label}</p>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { services } = useServices();
  const { getPricing } = usePricing();
  const { currency, fmt } = useCurrency();
  const { serviceOrder, clearServiceOrder, categoryOrder, clearCategoryOrder } = useOrderStore();
  const navigate = useNavigate();

  const isCategoryFlow = Boolean(categoryOrder);
  const paymentSucceeded = useRef(false);

  const [link, setLink] = useState(() => categoryOrder?.link ?? "");
  const [quantity, setQuantity] = useState<number>(() => serviceOrder?.min ?? 100);
  const [selectedPackageKey, setSelectedPackageKey] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Pricing ───────────────────────────────────────────────────────────────────
  const serviceTypeKey = isCategoryFlow
    ? CATEGORY_TO_SERVICE_TYPE[categoryOrder!.categoryName]
    : undefined;
  const pricing = serviceTypeKey ? getPricing(serviceTypeKey) : null;

  const packageOptions: PackageOption[] = [];
  if (pricing) {
    pricing.value_packages.filter((p) => p.is_active).forEach((p) => {
      packageOptions.push({
        key: `${p.quantity}-value`,
        quantity: p.quantity,
        packageType: "value",
        price: calcPackagePrice(pricing, p.quantity, "value"),
        discountLabel: buildDiscountLabel(p.discount_type, p.discount_value, fmt),
      });
    });
    pricing.bulk_packages.filter((p) => p.is_active).forEach((p) => {
      packageOptions.push({
        key: `${p.quantity}-bulk`,
        quantity: p.quantity,
        packageType: "bulk",
        price: calcPackagePrice(pricing, p.quantity, "bulk"),
        discountLabel: buildDiscountLabel(p.discount_type, p.discount_value, fmt),
      });
    });
  }

  useEffect(() => {
    if (!isCategoryFlow || !pricing || selectedPackageKey) return;
    const matching = packageOptions.find((o) => o.quantity === categoryOrder?.quantity);
    const key = matching?.key ?? packageOptions[0]?.key ?? "";
    if (key) setSelectedPackageKey(key);
  }, [pricing]);

  useEffect(() => {
    if (!serviceOrder && !categoryOrder && !paymentSucceeded.current) {
      navigate("/services", { replace: true });
    }
  }, [serviceOrder, categoryOrder, navigate]);

  if (!authLoading && !isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (!serviceOrder && !categoryOrder) return null;

  // ── Derived ───────────────────────────────────────────────────────────────────
  const effectivePackageKey = selectedPackageKey || packageOptions[0]?.key || "";
  const selectedPkg = packageOptions.find((o) => o.key === effectivePackageKey);
  const selectedQuantity = selectedPkg?.quantity ?? categoryOrder?.quantity ?? 1;

  const serviceName = isCategoryFlow ? categoryOrder!.categoryName : serviceOrder!.serviceName;
  const description = isCategoryFlow ? "" : serviceOrder!.description;
  const displayQuantity = isCategoryFlow ? selectedQuantity : quantity;
  const min = isCategoryFlow ? 1 : serviceOrder!.min;
  const max = isCategoryFlow ? Infinity : serviceOrder!.max;

  const activeRate = isCategoryFlow
    ? (services.find((s) => s.default_for_category === categoryOrder!.categoryName)?.rate ?? 0)
    : serviceOrder!.rate;

  const personalDiscount = user?.personal_discount ?? 0;

  const rawCharge = selectedPkg
    ? selectedPkg.price
    : (activeRate * displayQuantity) / 1000;
  const afterPersonalDiscount = personalDiscount > 0
    ? rawCharge * (1 - personalDiscount / 100)
    : rawCharge;
  const finalCharge = Math.max(afterPersonalDiscount, 0.50);

  const categoryPackageValid = packageOptions.length === 0 || effectivePackageKey !== "";
  const isValid = link.trim().length > 0 &&
    (isCategoryFlow ? categoryPackageValid : quantity >= min && quantity <= max);

  const valueOptions = packageOptions.filter((o) => o.packageType === "value");
  const bulkOptions  = packageOptions.filter((o) => o.packageType === "bulk");

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function extractError(err: unknown): string {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    return typeof detail === "string" ? detail : "Failed to place order. Please try again.";
  }

  function buildOrderBody(): Record<string, string | number> {
    const body: Record<string, string | number> = {
      link: link.trim(),
      quantity: isCategoryFlow ? selectedQuantity : quantity,
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
    } catch (err) {
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
      const { order_id, razorpay_order_id, key_id, amount, currency, description: desc } = res.data;
      const options: Record<string, unknown> = {
        key: key_id, amount, currency,
        name: "Glow-Apex", description: desc, order_id: razorpay_order_id,
        prefill: { name: user?.full_name ?? "", email: user?.email ?? "", method: "upi", vpa: "" },
        theme: { color: "#0d9488" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Set immediately — Razorpay calls this only on confirmed payment.
          // This prevents the useEffect from redirecting to /services during the
          // async verify call below (which may trigger a re-render via ondismiss).
          paymentSucceeded.current = true;
          try {
            await api.post(API_ENDPOINTS.RAZORPAY_VERIFY, {
              order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            isCategoryFlow ? clearCategoryOrder() : clearServiceOrder();
            navigate("/dashboard/orders");
          } catch (verifyErr) {
            setError(extractError(verifyErr));
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      new Razorpay(options).open();
    } catch (err) {
      setError(extractError(err));
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!link.trim()) return;
    if (!isCategoryFlow && (quantity < serviceOrder!.min || quantity > serviceOrder!.max)) return;
    if (paymentMethod === "razorpay") await handleRazorpay();
    else await handleStripe();
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complete Your Order</h1>
          <p className="text-sm text-gray-500 mt-1">You're just a few steps away from boosting your channel.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left column: steps ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Step 1 — Package selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <StepHeader num={1} label="Select Your Package" />

              {isCategoryFlow ? (
                packageOptions.length > 0 ? (
                  <>
                    <select
                      value={effectivePackageKey}
                      onChange={(e) => setSelectedPackageKey(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white"
                    >
                      {valueOptions.length > 0 && (
                        <optgroup label="Value Packages">
                          {valueOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.quantity.toLocaleString()} units — {fmt(opt.price)}
                              {opt.discountLabel ? ` (${opt.discountLabel})` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {bulkOptions.length > 0 && (
                        <optgroup label="Bulk Packages">
                          {bulkOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.quantity.toLocaleString()} units — {fmt(opt.price)}
                              {opt.discountLabel ? ` (${opt.discountLabel})` : ""}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {selectedPkg?.discountLabel && (
                      <p className="text-xs text-emerald-600 mt-1.5">
                        Discount applied: {selectedPkg.discountLabel}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-700">
                    {displayQuantity.toLocaleString()} units
                  </div>
                )
              ) : (
                /* Service flow — styled number input */
                <div>
                  <input
                    type="number"
                    min={min}
                    max={max === Infinity ? undefined : max}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 font-medium"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Min: {min.toLocaleString()} — Max: {max === Infinity ? "—" : max.toLocaleString()}
                  </p>
                  {quantity < min && <p className="text-xs text-red-500 mt-1">Minimum quantity is {min.toLocaleString()}</p>}
                  {max !== Infinity && quantity > max && <p className="text-xs text-red-500 mt-1">Maximum quantity is {max.toLocaleString()}</p>}
                  {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
                </div>
              )}
            </div>

            {/* Step 2 — YouTube link */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <StepHeader num={2} label="Enter Your YouTube Link" />
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Paste the full URL of the video, channel, or post you want to promote.</p>
            </div>

            {/* Step 3 — Payment method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <StepHeader num={3} label="Choose Payment Method" />
              <div className="grid grid-cols-2 gap-3">
                {/* Stripe */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("stripe")}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === "stripe"
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    paymentMethod === "stripe" ? "bg-teal-100" : "bg-gray-100"
                  }`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === "stripe" ? "text-teal-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Stripe</p>
                    <p className="text-xs text-gray-400">Card · USD</p>
                  </div>
                  {paymentMethod === "stripe" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>

                {/* Razorpay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    paymentMethod === "razorpay" ? "bg-amber-100" : "bg-gray-100"
                  }`}>
                    <Zap className={`w-5 h-5 ${paymentMethod === "razorpay" ? "text-amber-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Razorpay</p>
                    <p className="text-xs text-gray-400">UPI · INR</p>
                  </div>
                  {paymentMethod === "razorpay" && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!isValid || loading}
                className="mt-5 w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {paymentMethod === "razorpay" ? "Opening Payment…" : "Redirecting…"}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay {fmt(finalCharge)} — {paymentMethod === "razorpay" ? "Razorpay" : "Stripe"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right column: summary ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-6">

              {/* Service name */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Service</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{serviceName}</p>
                </div>
              </div>

              {/* Package details */}
              {selectedPkg && (
                <div className={`rounded-xl px-4 py-3 mb-4 ${
                  selectedPkg.packageType === "value" ? "bg-teal-50 border border-teal-100" : "bg-indigo-50 border border-indigo-100"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                      selectedPkg.packageType === "value" ? "text-teal-600" : "text-indigo-600"
                    }`}>
                      {selectedPkg.packageType} package
                    </span>
                    {selectedPkg.discountLabel && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                        {selectedPkg.discountLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{selectedPkg.quantity.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">units</p>
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Quantity</span>
                  <span className="font-medium">{displayQuantity.toLocaleString()}</span>
                </div>
                {selectedPkg ? (
                  <>
                    {selectedPkg.discountLabel && (
                      <>
                        <div className="flex justify-between text-gray-400">
                          <span>Original price</span>
                          <span className="line-through">
                            {fmt((displayQuantity / 1000) * (pricing?.price_per_1000 ?? 0))}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span>
                          <span>− {selectedPkg.discountLabel}</span>
                        </div>
                      </>
                    )}
                  </>
                ) : activeRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Rate</span>
                    <span className="font-medium">{fmt(activeRate, 3)} / 1k</span>
                  </div>
                )}

                {personalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Personal Discount</span>
                    <span>−{personalDiscount}%</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">{fmt(finalCharge)}</span>
                    <span className="text-xs text-gray-400 ml-1">{currency.code}</span>
                  </div>
                </div>

                {paymentMethod === "razorpay" && currency.code === "USD" && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>≈ INR equivalent charged by Razorpay</span>
                  </div>
                )}
                {rawCharge < 0.50 && (activeRate > 0 || selectedPkg) && (
                  <p className="text-xs text-amber-600">{fmt(0.50)} minimum charge applied.</p>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              {[
                { icon: <ShieldCheck className="w-4 h-4 text-teal-500" />, label: "Secure & Encrypted Payment" },
                { icon: <Zap className="w-4 h-4 text-amber-500" />, label: "Fast Delivery Guaranteed" },
                { icon: <Check className="w-4 h-4 text-emerald-500" />, label: "24/7 Customer Support" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-gray-600">
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
