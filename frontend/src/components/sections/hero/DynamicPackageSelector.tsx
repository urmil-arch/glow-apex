import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { usePricing, calcPackagePrice } from "@/context/PricingContext";

interface DynamicPackageSelectorProps {
  serviceType: string;   // backend key e.g. "youtube_views"
  categoryName: string;  // checkout category e.g. "YouTube Views"
  title?: string;
}

const DynamicPackageSelector: React.FC<DynamicPackageSelectorProps> = ({
  serviceType,
  categoryName,
  title,
}) => {
  const navigate = useNavigate();
  const { setCategoryOrder } = useOrderStore();
  const { getPricing, isLoading } = usePricing();
  const [packageType, setPackageType] = useState<"value" | "bulk">("value");
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);

  const pricing = getPricing(serviceType);
  const valuePackages = pricing?.value_packages.filter((p) => p.is_active) ?? [];
  const bulkPackages  = pricing?.bulk_packages.filter((p) => p.is_active) ?? [];
  const hasValue = valuePackages.length > 0;
  const hasBulk  = bulkPackages.length > 0;
  const showToggle = hasValue && hasBulk;

  // If current tab has no packages, switch to the other automatically
  const effectiveType: "value" | "bulk" = (() => {
    if (packageType === "value" && !hasValue && hasBulk) return "bulk";
    if (packageType === "bulk"  && !hasBulk  && hasValue) return "value";
    return packageType;
  })();

  const activePackages = effectiveType === "value" ? valuePackages : bulkPackages;

  const effectiveQuantity = selectedQuantity ?? activePackages[0]?.quantity ?? null;
  const selectedPkg = activePackages.find((p) => p.quantity === effectiveQuantity);
  const price = pricing && selectedPkg ? calcPackagePrice(pricing, selectedPkg.quantity, effectiveType) : 0;
  const basePrice = pricing && selectedPkg ? (selectedPkg.quantity / 1000) * pricing.price_per_1000 : 0;
  const hasDiscount = selectedPkg && selectedPkg.discount_type !== "none";
  const discountLabel = hasDiscount
    ? selectedPkg.discount_type === "percentage"
      ? `${selectedPkg.discount_value}% OFF`
      : `$${selectedPkg.discount_value.toFixed(2)} OFF`
    : null;

  const handleTypeSwitch = (type: "value" | "bulk") => {
    setPackageType(type);
    setSelectedQuantity(null);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 shadow-xl py-12 px-6 rounded-2xl relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      {/* Background decorations */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-teal-400/10 to-emerald-500/10 rounded-full -mr-20 -mt-20 z-0"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-t from-teal-400/10 to-emerald-500/10 rounded-full -ml-20 -mb-20 z-0"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ repeat: Infinity, duration: 5, delay: 1 }}
      />

      {/* Title */}
      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          {title ?? `Buy ${categoryName}`}
        </h2>
        <p className="text-lg mt-2 text-gray-600">
          Select a package that you like and submit Order Now button
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 z-10">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : !pricing || (!hasValue && !hasBulk) ? (
        <div className="py-8 text-center text-gray-400 z-10 max-w-xs">
          <p className="text-sm">Pricing not configured yet. Please check back soon.</p>
        </div>
      ) : (
        <>
          {/* Package type toggle — only shown when both types exist */}
          {showToggle && (
            <motion.div
              className="flex items-center gap-2 w-full max-w-md z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {(["value", "bulk"] as const).map((type) => (
                <motion.button
                  key={type}
                  onClick={() => handleTypeSwitch(type)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm capitalize transition-all ${
                    effectiveType === type
                      ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-md"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {type === "value" ? "Value Packages" : "Bulk Packages"}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Quantity cards */}
          <motion.div
            className="max-w-md w-full z-10"
            key={effectiveType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              {activePackages.map((pkg) => {
                const isSelected = effectiveQuantity === pkg.quantity;
                return (
                  <motion.div
                    key={pkg.quantity}
                    className={`p-3 border-2 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all min-w-[80px] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                    onClick={() => setSelectedQuantity(pkg.quantity)}
                    whileHover={{ y: -4, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    whileTap={{ y: 0 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <p className="text-2xl font-bold text-gray-800">
                      {pkg.quantity.toLocaleString()}
                    </p>
                    {pkg.discount_type !== "none" && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {pkg.discount_type === "percentage"
                          ? `${pkg.discount_value}% OFF`
                          : `$${pkg.discount_value.toFixed(2)} OFF`}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Price + Buy Now */}
          <motion.div
            className="flex flex-col items-center justify-center gap-2 mt-6 z-10 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <motion.p
                className="text-6xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent"
                key={`${effectiveType}-${effectiveQuantity}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <span className="text-lg font-normal text-black">$</span>
                {price.toFixed(2)}
              </motion.p>
              {discountLabel && (
                <motion.span
                  className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {discountLabel}
                </motion.span>
              )}
            </div>

            <div className="text-center text-gray-500 text-sm mb-6">
              {effectiveQuantity?.toLocaleString()} units at $
              {pricing.price_per_1000 > 0
                ? (pricing.price_per_1000 / 1000).toFixed(4)
                : "0.0000"}{" "}
              each
              {hasDiscount && (
                <span className="ml-2 line-through text-gray-400">
                  ${basePrice.toFixed(2)}
                </span>
              )}
            </div>

            <motion.button
              onClick={() => {
                if (!effectiveQuantity) return;
                setCategoryOrder({ categoryName, quantity: effectiveQuantity });
                navigate("/checkout");
              }}
              disabled={!effectiveQuantity}
              className="cursor-pointer text-xl bg-gradient-to-r from-teal-400 to-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out w-full max-w-xs disabled:opacity-50"
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(45,212,191,0.3)" }}
              whileTap={{ y: 0 }}
            >
              Buy Now
            </motion.button>

            <motion.div
              className="flex items-center gap-2 mt-4 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Payment
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default DynamicPackageSelector;
