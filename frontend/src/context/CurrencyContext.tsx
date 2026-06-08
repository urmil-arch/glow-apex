import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const FALLBACK_RATE = 84;

interface CurrencyData {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencyContextValue {
  currency: CurrencyData;
  rate: number;
  fmt: (usdAmount: number, decimals?: number) => string;
}

const USD: CurrencyData = { code: "USD", symbol: "$", name: "USD" };

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: USD,
  rate: 1,
  fmt: (usd, decimals = 2) => `$${usd.toFixed(decimals)}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyData>(USD);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (!saved) return;
    try {
      const parsed: CurrencyData = JSON.parse(saved);
      setCurrency(parsed);
      if (parsed.code === "INR") {
        fetch("https://api.frankfurter.dev/v2/rate/USD/INR")
          .then((r) => r.json())
          .then((data) => {
            const r = data?.rates?.INR ?? data?.rate ?? data?.INR ?? FALLBACK_RATE;
            setRate(Number(r) || FALLBACK_RATE);
          })
          .catch(() => setRate(FALLBACK_RATE));
      }
    } catch {
      // malformed localStorage — use defaults
    }
  }, []);

  const fmt = (usdAmount: number, decimals = 2): string => {
    const converted = usdAmount * rate;
    if (currency.code === "INR") {
      return `₹${converted.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    }
    return `$${converted.toFixed(decimals)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, rate, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
};
