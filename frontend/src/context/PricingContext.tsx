import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/config";

export interface PricingPackage {
  quantity: number;
  discount_type: "none" | "fixed" | "percentage";
  discount_value: number;
  is_active: boolean;
}

export interface ServicePricing {
  service_type: string;
  display_name: string;
  price_per_1000: number;
  value_packages: PricingPackage[];
  bulk_packages: PricingPackage[];
  is_active: boolean;
}

export function calcPackagePrice(
  pricing: ServicePricing,
  quantity: number,
  packageType: "value" | "bulk",
): number {
  const base = (quantity / 1000) * pricing.price_per_1000;
  const list = packageType === "value" ? pricing.value_packages : pricing.bulk_packages;
  const pkg = list.find((p) => p.quantity === quantity && p.is_active);
  if (!pkg || pkg.discount_type === "none") return base;
  if (pkg.discount_type === "fixed") return Math.max(0, base - pkg.discount_value);
  if (pkg.discount_type === "percentage") return Math.max(0, base * (1 - pkg.discount_value / 100));
  return base;
}

interface PricingContextValue {
  pricing: ServicePricing[];
  isLoading: boolean;
  getPricing: (serviceType: string) => ServicePricing | null;
}

const PricingContext = createContext<PricingContextValue>({
  pricing: [],
  isLoading: true,
  getPricing: () => null,
});

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pricing, setPricing] = useState<ServicePricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get<ServicePricing[]>(API_ENDPOINTS.PUBLIC_PRICING)
      .then((res) => setPricing(res.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const getPricing = (serviceType: string): ServicePricing | null =>
    pricing.find((p) => p.service_type === serviceType) ?? null;

  return (
    <PricingContext.Provider value={{ pricing, isLoading, getPricing }}>
      {children}
    </PricingContext.Provider>
  );
};

export const usePricing = () => useContext(PricingContext);
