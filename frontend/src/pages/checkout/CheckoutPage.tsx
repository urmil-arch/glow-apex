import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  ArrowLeft, Bitcoin, Check, CreditCard, ExternalLink,
  Loader, Lock, PlayCircle, ShieldCheck, Zap,
} from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuth } from "@/context/AuthContext";
import { usePricing, calcPackagePrice } from "@/context/PricingContext";
import { useCurrency } from "@/context/CurrencyContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS, GLOWAPEX_CHECKOUT_URL } from "@/config";


interface CheckoutInitResponse {
  token: string;
  expires_in: number;
  payment_url?: string;
}

interface PackageOption {
  key: string;
  quantity: number;
  packageType: "value" | "bulk";
  price: number;
  discountLabel?: string;
}

interface PublicSettings {
  payment_stripe_enabled: boolean;
  payment_razorpay_enabled: boolean;
  payment_cryptomus_enabled: boolean;
}

type PaymentMethod = "stripe" | "razorpay" | "cryptomus";

const CATEGORY_TO_SERVICE_TYPE: Record<string, string> = {
  "YouTube Views":                "youtube_views",
  "YouTube Likes":                "youtube_likes",
  "YouTube Subscribers":          "youtube_subscribers",
  "YouTube Comments":             "youtube_comments",
  "YouTube Shorts Views":         "youtube_shorts_views",
  "YouTube Shorts Likes":         "youtube_shorts_likes",
  "Country Targeted Subscribers": "country_targeted_subscribers",
};

const SERVICE_UNIT: Record<string, string> = {
  youtube_views:                "Views",
  youtube_likes:                "Likes",
  youtube_subscribers:          "Subscribers",
  youtube_comments:             "Comments",
  youtube_shorts_views:         "Shorts Views",
  youtube_shorts_likes:         "Shorts Likes",
  country_targeted_subscribers: "Subscribers",
};

const YOUTUBE_REGEX = /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?.*v=[\w-]+|shorts\/[\w-]+|live\/[\w-]+|channel\/[\w-]+|c\/[\w-]+|user\/[\w-]+|@[\w.-]+)|youtu\.be\/[\w-]+)/i;

function isValidYouTubeLink(url: string): boolean {
  return YOUTUBE_REGEX.test(url.trim());
}

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
  const { getPricing } = usePricing();
  const { currency, fmt } = useCurrency();
  const { serviceOrder, categoryOrder } = useOrderStore();
  const navigate = useNavigate();

  const isCategoryFlow = Boolean(categoryOrder);

  const [link, setLink] = useState(() => categoryOrder?.link ?? "");
  const [quantity, setQuantity] = useState<number>(() => serviceOrder?.min ?? 100);
  const [selectedPackageKey, setSelectedPackageKey] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicSettings, setPublicSettings] = useState<PublicSettings>({
    payment_stripe_enabled: true,
    payment_razorpay_enabled: true,
    payment_cryptomus_enabled: true,
  });

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
    api.get<PublicSettings>(API_ENDPOINTS.PUBLIC_SETTINGS)
      .then((res) => setPublicSettings(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const available: PaymentMethod[] = [];
    if (publicSettings.payment_stripe_enabled) available.push("stripe");
    if (publicSettings.payment_razorpay_enabled) available.push("razorpay");
    if (publicSettings.payment_cryptomus_enabled) available.push("cryptomus");
    if (available.length > 0 && !available.includes(paymentMethod)) {
      setPaymentMethod(available[0]);
    }
  }, [
    publicSettings.payment_stripe_enabled,
    publicSettings.payment_razorpay_enabled,
    publicSettings.payment_cryptomus_enabled,
  ]);

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
  const unitLabel = SERVICE_UNIT[serviceTypeKey ?? ""] ?? serviceName;

  const personalDiscount = user?.personal_discount ?? 0;

  const rawCharge = selectedPkg
    ? selectedPkg.price
    : isCategoryFlow ? 0 : (serviceOrder!.rate * displayQuantity) / 1000;
  const afterPersonalDiscount = personalDiscount > 0
    ? rawCharge * (1 - personalDiscount / 100)
    : rawCharge;
  const finalCharge = Math.max(afterPersonalDiscount, 0.50);

  const categoryPackageValid = packageOptions.length === 0 || effectivePackageKey !== "";
  const linkTouched = link.trim().length > 0;
  const linkValid = linkTouched && isValidYouTubeLink(link);
  const isValid = linkValid &&
    (isCategoryFlow ? categoryPackageValid : quantity >= min && quantity <= max);

  const valueOptions = packageOptions.filter((o) => o.packageType === "value");
  const bulkOptions  = packageOptions.filter((o) => o.packageType === "bulk");

  const anyPaymentEnabled =
    publicSettings.payment_stripe_enabled ||
    publicSettings.payment_razorpay_enabled ||
    publicSettings.payment_cryptomus_enabled;
  const enabledMethodsCount = [
    publicSettings.payment_stripe_enabled,
    publicSettings.payment_razorpay_enabled,
    publicSettings.payment_cryptomus_enabled,
  ].filter(Boolean).length;
  const methodsGridClass =
    enabledMethodsCount >= 3 ? "grid-cols-3" : enabledMethodsCount === 2 ? "grid-cols-2" : "grid-cols-1";

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
      if (selectedPkg) {
        body.package_type = selectedPkg.packageType;
      }
    } else {
      body.service_id = serviceOrder!.serviceId;
    }
    return body;
  }

  // Stripe / Razorpay: create the session then redirect to the Glow Apex portal,
  // telling the backend which store to return the user to after payment.
  async function redirectToGlowApex(method: "stripe" | "razorpay") {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CheckoutInitResponse>(API_ENDPOINTS.CHECKOUT_INIT, {
        ...buildOrderBody(),
        payment_method: method,
        return_origin: window.location.origin,
      });
      window.location.href = `${GLOWAPEX_CHECKOUT_URL}?token=${res.data.token}`;
    } catch (err) {
      setError(extractError(err));
      setLoading(false);
    }
  }

  async function startCryptomus() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CheckoutInitResponse>(API_ENDPOINTS.CHECKOUT_INIT, {
        ...buildOrderBody(),
        payment_method: "cryptomus",
        return_origin: window.location.origin,
      });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        setError("Failed to create Cryptomus payment. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(extractError(err));
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!link.trim()) return;
    if (!isCategoryFlow && (quantity < serviceOrder!.min || quantity > serviceOrder!.max)) return;
    if (paymentMethod === "cryptomus") await startCryptomus();
    else await redirectToGlowApex(paymentMethod);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">

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
                              {opt.quantity.toLocaleString()} {unitLabel}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {bulkOptions.length > 0 && (
                        <optgroup label="Bulk Packages">
                          {bulkOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.quantity.toLocaleString()} {unitLabel}
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
                    {displayQuantity.toLocaleString()} {unitLabel}
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
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <PlayCircle className={`w-4 h-4 ${linkTouched ? (linkValid ? "text-teal-500" : "text-red-500") : "text-red-500"}`} />
                </div>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className={`w-full text-sm border rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 transition-colors ${
                    !linkTouched
                      ? "border-gray-200 focus:ring-teal-400 focus:border-teal-400"
                      : linkValid
                      ? "border-teal-400 focus:ring-teal-400 focus:border-teal-400"
                      : "border-red-400 focus:ring-red-300 focus:border-red-400"
                  }`}
                />
                {linkTouched && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {linkValid ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:text-teal-600">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Check className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                )}
              </div>
              {linkTouched && !linkValid && (
                <p className="text-xs text-red-500 mt-2">Please enter a valid YouTube URL (video, channel, or shorts link).</p>
              )}
              {!linkTouched && (
                <p className="text-xs text-gray-400 mt-2">Paste the full URL of the video, channel, or post you want to promote.</p>
              )}
            </div>

            {/* Step 3 — Payment method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <StepHeader num={3} label="Choose Payment Method" />

              {!anyPaymentEnabled ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Payment Temporarily Unavailable</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    We're not accepting payments at this time. Please check back shortly or contact support.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`grid gap-3 ${methodsGridClass}`}>
                    {/* Stripe */}
                    {publicSettings.payment_stripe_enabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("stripe")}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
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
                    )}

                    {/* Razorpay */}
                    {publicSettings.payment_razorpay_enabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("razorpay")}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
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
                    )}

                    {/* Cryptomus */}
                    {publicSettings.payment_cryptomus_enabled && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cryptomus")}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "cryptomus"
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          paymentMethod === "cryptomus" ? "bg-orange-100" : "bg-gray-100"
                        }`}>
                          <Bitcoin className={`w-5 h-5 ${paymentMethod === "cryptomus" ? "text-orange-600" : "text-gray-500"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Crypto</p>
                          <p className="text-xs text-gray-400">USDT · TRC-20</p>
                        </div>
                        {paymentMethod === "cryptomus" && (
                          <span className="absolute top-3 right-3 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </button>
                    )}
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
                        {paymentMethod === "cryptomus"
                          ? "Generating invoice…"
                          : paymentMethod === "razorpay"
                            ? "Opening Payment…"
                            : "Redirecting…"}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Pay {fmt(finalCharge)} — {paymentMethod === "cryptomus"
                          ? "Crypto"
                          : paymentMethod === "razorpay"
                            ? "Razorpay"
                            : "Stripe"}
                      </>
                    )}
                  </button>
                </>
              )}
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
                  <p className="text-xs text-gray-500">{unitLabel}</p>
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Quantity</span>
                  <span className="font-medium">{displayQuantity.toLocaleString()} {unitLabel}</span>
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
                ) : null}

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
                {rawCharge < 0.50 && selectedPkg && (
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
