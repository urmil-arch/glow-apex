import { useState, useEffect } from "react";
import { CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import currency from "currency.js";
import { currencyFormats, servicesPackages } from "@/config/data";
import { useOrderStore } from "@/store/useOrderStore";

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

interface PackagesData {
  [key: string]: PackageData;
}

const YoutubeLikesHeroSection: React.FC = () => {
  const { service_id } = useParams();
  const navigate = useNavigate();
  const { setCategoryOrder } = useOrderStore();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] =
    useState<string>("high-quality");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(100);
  const [totalPrice, setTotalPrice] = useState<string>("3.99");
  const [convertedPrice, setConvertedPrice] = useState<string>("3.99");
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: "USD",
    symbol: "$",
    name: "USD",
  });

  // Sample packages data - replace with actual data
  // Prices are in USD
  const packages: PackagesData = servicesPackages.likes;

  // Load saved currency from cookies
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency");
    console.log(savedCurrency);
    if (savedCurrency) {
      try {
        const parsedCurrency = JSON.parse(savedCurrency);
        if (parsedCurrency && parsedCurrency.code && parsedCurrency.symbol) {
          setSelectedCurrency(parsedCurrency);
        }
      } catch (error) {
        console.error("Error parsing currency cookie:", error);
      }
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    updatePrice();
  }, [selectedPackage, selectedQuantity, selectedCurrency]);

  // Convert price based on selected currency
  const convertPrice = (priceInUsd: string, currencyCode: string): string => {
    // Get the exchange rate for the selected currency
    const rate = exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;

    // Get formatting options for the currency
    const format =
      currencyFormats[currencyCode as keyof typeof currencyFormats] ||
      currencyFormats.USD;

    // Convert the price
    const convertedValue = parseFloat(priceInUsd) * rate;

    // Format the price using currency.js
    const formattedPrice = currency(convertedValue, {
      symbol: format.symbol,
      precision: format.precision,
    });

    // Return the formatted price based on pattern
    if (format.pattern === "#!") {
      return `${formattedPrice.value.toFixed(format.precision)}${
        format.symbol
      }`;
    } else {
      return formattedPrice.format();
    }
  };

  const updatePrice = (): void => {
    const selectedOption = packages[selectedPackage].quantities.find(
      (option: QuantityOption) => option.amount === selectedQuantity
    );

    if (selectedOption) {
      setTotalPrice(selectedOption.price);
      setDiscount(selectedOption.discount);

      // Update the converted price based on selected currency
      const priceInSelectedCurrency = convertPrice(
        selectedOption.price,
        selectedCurrency.code
      );
      setConvertedPrice(priceInSelectedCurrency);
    }
  };

  // Calculate unit price in selected currency
  const getUnitPrice = (): string => {
    if (selectedQuantity === 0) return "0";
    const priceInUsd = parseFloat(totalPrice) / selectedQuantity;
    return convertPrice(priceInUsd.toString(), selectedCurrency.code);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const checkboxAnimation = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const cardAnimation = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const features: string[] = [
    "Authentic YouTube Likes",
    "High Engagement",
    "No Drop in Likes",
    "Safe Payment",
    "Customer Support",
    "Delivery on Time",
  ];

  useEffect(() => {
    const firstQuantity =
      servicesPackages["likes"][selectedPackage].quantities[0].amount;
    setSelectedQuantity(firstQuantity);
  }, [selectedPackage]);

  return (
    <section className="container mx-auto px-4 pb-12 lg:pb-20 pt-44">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Content Side */}
        <motion.div
          className="flex flex-col gap-2"
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-gradient-to-r from-teal-400/10 to-emerald-500/10 text-emerald-600 font-medium px-4 py-2 rounded-full w-fit mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Most Popular Service
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold capitalize mb-3"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            Buy YouTube{" "}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Likes
            </motion.span>{" "}
            now
          </motion.h1>

          <motion.p
            className="text-lg text-gray-600 mb-4"
            variants={fadeIn}
            transition={{ delay: 0.3 }}
          >
            Give wings to your YouTube videos with high quality YouTube likes
            that no YouTube algorithm can suspect. Because, they are from real
            people! Experience the doping effect of the right audience with a
            reasonable price with BuyRealViews. Read what is written about us in
            the press.
          </motion.p>

          <motion.hr
            className="border border-t-black/10 w-full my-6"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: 0.4 }}
          />

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 items-center justify-center gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.5,
                },
              },
            }}
          >
            {features.map((feature, index) => (
              <motion.p
                key={index}
                className="font-semibold flex items-center justify-start gap-2 text-gray-700"
                variants={checkboxAnimation}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  className="text-emerald-500"
                >
                  <CheckSquare size={20} />
                </motion.span>
                {feature}
              </motion.p>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs overflow-hidden"
                >
                  <img
                    src={`/assets/images/users/user${i + 1}.jpg`}
                    alt="user"
                    height={32}
                    width={32}
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-black">950+</span> customers
              bought this in the last 24 hours
            </p>
          </motion.div>
        </motion.div>

        {/* Form Side */}
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
              Buy Youtube Likes
            </h2>
            <p className="text-lg mt-2 text-gray-600">
              Select a package that you like and submit Order Now button
            </p>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-2 w-full max-w-md z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {Object.keys(servicesPackages["likes"]).map((packageType) => {
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
                  {servicesPackages["likes"][packageType].name}
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            className="max-w-md w-full z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              {packages[selectedPackage].quantities.map((option) => (
                <motion.div
                  key={option.amount}
                  className={`p-3 border-2 rounded-lg cursor-pointer flex flex-col items-center justify-center transition-all ${
                    selectedQuantity === option.amount
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                  onClick={(): void => setSelectedQuantity(option.amount)}
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
                  {option.discount > 0 && (
                    <p className="text-sm text-emerald-600">
                      Save {option.discount}%
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

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
              {discount > 0 && (
                <motion.span
                  className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  {discount}% OFF
                </motion.span>
              )}
            </div>
            <div className="text-center text-gray-500 text-sm mb-6">
              {selectedQuantity} {packages[selectedPackage].name} at{" "}
              {getUnitPrice()} each
            </div>

            <motion.button
              onClick={() => {
                setCategoryOrder({ categoryName: "YouTube Likes", quantity: selectedQuantity });
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

            <motion.div
              className="flex items-center gap-2 mt-4 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
              Secure Payment
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default YoutubeLikesHeroSection;
