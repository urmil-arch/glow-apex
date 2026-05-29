import React, { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import currency from "currency.js";
import { useOrderStore } from "@/store/useOrderStore";
import { useServices } from "@/context/ServicesContext";
import { currencyFormats, servicesPackages } from "@/config/data";

// Define exchange rates (in a real app, you'd fetch these from an API)
const exchangeRates = {
  USD: 1,
  INR: 83.12,
  EUR: 0.92,
  GBP: 0.79,
};

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface QuantityOption {
  amount: number;
  price: string;
  discount: number;
}

interface PackageData {
  name: string;
  quantities: QuantityOption[];
}

export interface ServicesPackages {
  [key: string]: {
    [key: string]: PackageData;
  };
}

interface ServiceSelectionComponentProps {
  serviceType: string;
}

const ServiceSelectionComponent: React.FC<ServiceSelectionComponentProps> = ({
  serviceType,
}) => {
  const navigate = useNavigate();
  const { setCategoryOrder } = useOrderStore();
  const { services } = useServices();
  const [selectedPackage, setSelectedPackage] =
    useState<string>("high-quality");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(100);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: "USD",
    symbol: "$",
    name: "USD",
  });

  // Service titles for display
  const serviceTitles = {
    likes: "YouTube Likes",
    views: "YouTube Views",
    comments: "YouTube Comments",
    subscribers: "YouTube Subscribers",
    "shorts-likes": "YouTube Shorts Likes",
    "shorts-views": "YouTube Shorts Views",
  };

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) {
      try {
        const parsedCurrency = JSON.parse(savedCurrency);
        if (parsedCurrency && parsedCurrency.code && parsedCurrency.symbol) {
          setSelectedCurrency(parsedCurrency);
        }
      } catch (error) {
        console.error("Error parsing currency:", error);
      }
    }
  }, []);

  // When serviceType changes, reset the package and quantity
  useEffect(() => {
    setSelectedPackage("high-quality");

    // Set the default quantity based on the service type
    if (
      servicesPackages[serviceType] &&
      servicesPackages[serviceType]["high-quality"]
    ) {
      const firstQuantity =
        servicesPackages[serviceType]["high-quality"].quantities[0].amount;
      setSelectedQuantity(firstQuantity);
    }
  }, [serviceType]);

  const convertPrice = (priceInUsd: string, currencyCode: string): string => {
    const rate = exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;
    const format =
      currencyFormats[currencyCode as keyof typeof currencyFormats] ||
      currencyFormats.USD;
    const convertedValue = parseFloat(priceInUsd) * rate;
    const formattedPrice = currency(convertedValue, {
      symbol: format.symbol,
      precision: 2,
    });
    if (format.pattern === "#!") {
      return `${formattedPrice.value.toFixed(2)}${format.symbol}`;
    } else {
      return formattedPrice.format();
    }
  };

  const categoryName = serviceTitles[serviceType as keyof typeof serviceTitles];
  const serviceRate = services.find(s => s.default_for_category === categoryName)?.rate ?? 0;
  const totalPriceUsd = (serviceRate * selectedQuantity) / 1000;
  const convertedPrice = convertPrice(totalPriceUsd.toString(), selectedCurrency.code);

  const getUnitPrice = (): string => {
    if (serviceRate === 0) return "0";
    const unitPriceUsd = serviceRate / 1000;
    const rate = exchangeRates[selectedCurrency.code as keyof typeof exchangeRates] || 1;
    const format =
      currencyFormats[selectedCurrency.code as keyof typeof currencyFormats] ||
      currencyFormats.USD;
    const convertedValue = unitPriceUsd * rate;
    const formattedPrice = currency(convertedValue, {
      symbol: format.symbol,
      precision: 3,
    });
    if (format.pattern === "#!") {
      return `${formattedPrice.value.toFixed(3)}${format.symbol}`;
    } else {
      return formattedPrice.format();
    }
  };

  // Animation variants
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardAnimation: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 shadow-xl py-12 px-6 rounded-2xl relative overflow-hidden"
      variants={cardAnimation}
      initial="hidden"
      animate="visible"
    >
      {/* Background decorations */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-teal-400/10 to-emerald-500/10 rounded-full -mr-20 -mt-20 z-0"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-t from-teal-400/10 to-emerald-500/10 rounded-full -ml-20 -mb-20 z-0"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          delay: 1,
        }}
      />

      <motion.div className="text-center relative z-10" variants={fadeIn}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          Buy {serviceTitles[serviceType as keyof typeof serviceTitles]}
        </h2>
        <p className="text-lg mt-2 text-gray-600">
          Select a package that best fits your needs
        </p>
      </motion.div>

      {/* Package Types */}
      <motion.div
        className="flex items-center justify-center gap-2 w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {Object.keys(servicesPackages[serviceType]).map((packageType) => {
          return (
            <motion.button
              key={packageType}
              className={`flex-1 text-lg py-2 px-4 rounded-lg font-medium transition-all ${
                selectedPackage === packageType
                  ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-md"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedPackage(packageType)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              {servicesPackages[serviceType][packageType].name}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Quantity Selection */}
      <motion.div
        className="max-w-md w-full z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {servicesPackages[serviceType][selectedPackage].quantities.map(
            (option) => (
              <motion.div
                key={option.amount}
                className={`p-3 border-2 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all ${
                  selectedQuantity === option.amount
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-gray-200 hover:border-emerald-300"
                }`}
                onClick={() => setSelectedQuantity(option.amount)}
                whileHover={{
                  y: -4,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ y: 0 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: selectedQuantity === option.amount ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <p className="text-2xl font-bold text-gray-800">
                  {option.amount}
                </p>
              </motion.div>
            )
          )}
        </div>
      </motion.div>

      {/* Price and Checkout */}
      <motion.div
        className="flex flex-col items-center justify-center gap-2 mt-6 z-10 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-3">
          <motion.p
            className="text-6xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
            }}
          >
            <span className="text-lg font-normal text-black">
              {selectedCurrency.symbol}
            </span>
            {convertedPrice.replace(selectedCurrency.symbol, "")}
          </motion.p>
        </div>
        <div className="text-center text-gray-500 text-sm mb-6">
          {selectedQuantity}{" "}
          {servicesPackages[serviceType][selectedPackage].name} at{" "}
          {getUnitPrice()} each
        </div>

        <motion.button
          onClick={() => {
            setCategoryOrder({ categoryName: categoryName || serviceType, quantity: selectedQuantity });
            navigate("/checkout");
          }}
          className="cursor-pointer text-xl bg-gradient-to-r from-teal-400 to-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out w-full max-w-xs"
          whileHover={{
            y: -5,
            boxShadow: "0 10px 15px -3px rgba(45, 212, 191, 0.3)",
          }}
          whileTap={{ y: 0 }}
        >
          Buy Now
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ServiceSelectionComponent;
