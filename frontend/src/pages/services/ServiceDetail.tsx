import {
  Star,
  ShoppingCart,
  UserCheck,
  Shield,
  Clock,
  TrendingUp,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import currency from "currency.js";
import { servicesPackages } from "@/config/data";
import { useOrderStore } from "@/store/useOrderStore";

interface FormData {
  link: string;
  email: string;
  package: string;
  promotions: boolean;
}

interface PackageOption {
  id: string;
  amount: number;
  price: number;
  displayPrice?: string;
  popular?: boolean;
  delivery?: string;
  discount?: number;
}

interface OrderDataItem {
  service_id: string;
  product_id: string;
  user_email: string;
  user_link: string;
  purchase_type: string;
  product_price: string;
}

const exchangeRates = {
  USD: 1,
  INR: 83.12,
  EUR: 0.92,
  GBP: 0.79,
};

const currencyFormats = {
  USD: { symbol: "$", precision: 2, pattern: "!#" },
  INR: { symbol: "₹", precision: 0, pattern: "!#" },
  EUR: { symbol: "€", precision: 2, pattern: "#!" },
  GBP: { symbol: "£", precision: 2, pattern: "!#" },
};

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const serviceConfig = {
  likes: {
    id: "2342",
    title: "YouTube Likes",
    unit: "Likes",
    description:
      "Get real, high-quality YouTube likes from active users to increase your engagement and visibility.",
    linkPlaceholder: "https://youtube.com/watch?v=...",
    validation: (link: string) =>
      link.includes("youtube.com") || link.includes("youtu.be"),
    validationMessage: "Please enter a valid YouTube link",
    defaultDelivery: "1-2 hours",
  },
  views: {
    id: "5648",
    title: "YouTube Views",
    unit: "Views",
    description:
      "Boost your video's visibility with authentic YouTube views from real users worldwide.",
    linkPlaceholder: "https://youtube.com/watch?v=...",
    validation: (link: string) =>
      link.includes("youtube.com") || link.includes("youtu.be"),
    validationMessage: "Please enter a valid YouTube link",
    defaultDelivery: "2-4 hours",
  },
  comments: {
    id: "5649",
    title: "YouTube Comments",
    unit: "Comments",
    description:
      "Increase engagement with genuine YouTube comments from real users to boost your video's interaction.",
    linkPlaceholder: "https://youtube.com/watch?v=...",
    validation: (link: string) =>
      link.includes("youtube.com") || link.includes("youtu.be"),
    validationMessage: "Please enter a valid YouTube link",
    defaultDelivery: "4-6 hours",
  },
  subscribers: {
    id: "376",
    title: "YouTube Subscribers",
    unit: "Subscribers",
    description:
      "Grow your channel with real YouTube subscribers who are genuinely interested in your content.",
    linkPlaceholder: "https://youtube.com/channel/... or channel URL",
    validation: (link: string) =>
      link.includes("youtube.com") &&
      (link.includes("/channel/") ||
        link.includes("/c/") ||
        link.includes("/@") ||
        link.includes("/user/")),
    validationMessage: "Please enter a valid YouTube channel link",
    defaultDelivery: "1-3 days",
  },
};

const ServicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const serviceId = id as string;

  const { selectedPackage: storeSelectedPackage, clearSelectedPackage, setOrderData } =
    useOrderStore();

  const [formData, setFormData] = useState<FormData>({
    link: "",
    email: "",
    package: "",
    promotions: true,
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [errors, setErrors] = useState<{
    link?: string;
    email?: string;
  }>({});
  const [showPackages, setShowPackages] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(230);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: "USD",
    symbol: "$",
    name: "USD",
  });
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [packagesLoaded, setPackagesLoaded] = useState(false);

  // Randomly update online users count every 2-3 seconds
  useEffect(() => {
    const updateUserCount = (): void => {
      const change = Math.floor(Math.random() * 14) - 5;
      setOnlineUsers((prev) => {
        const newCount = prev + change;
        if (newCount < 200) return 200 + Math.floor(Math.random() * 10);
        if (newCount > 350) return 350 - Math.floor(Math.random() * 10);
        return newCount;
      });
    };

    const interval = setInterval(
      updateUserCount,
      2000 + Math.random() * 1000
    );
    return () => clearInterval(interval);
  }, []);

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
        console.error("Error parsing currency from localStorage:", error);
      }
    }
  }, []);

  // Update displayed prices when currency changes
  useEffect(() => {
    if (packageOptions.length > 0) {
      setPackageOptions((prevOptions) =>
        prevOptions.map((pkg) => ({
          ...pkg,
          displayPrice: convertPrice(
            pkg.price.toString(),
            selectedCurrency.code
          ),
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const serviceEntry = Object.entries(serviceConfig).find(
    ([, config]) => config.id === serviceId
  );
  const serviceType = serviceEntry ? serviceEntry[0] : null;
  const currentService = serviceEntry ? serviceEntry[1] : null;

  // Load packages and pre-select from Zustand store if applicable
  useEffect(() => {
    if (!serviceType || !currentService) return;

    const serviceData =
      servicesPackages[serviceType as keyof typeof servicesPackages];

    if (serviceData) {
      const allPackages: PackageOption[] = [];
      let packageIndex = 1;

      Object.entries(serviceData).forEach(([, packageInfo]) => {
        packageInfo.quantities.forEach(
          (qty: { amount: number; price: string; discount?: number }, index: number) => {
            const isPopular =
              index === Math.floor(packageInfo.quantities.length / 2);

            allPackages.push({
              id: `${packageIndex}`,
              amount: qty.amount,
              price: parseFloat(qty.price),
              popular: isPopular,
              delivery: currentService.defaultDelivery,
              discount: qty.discount || 0,
            });
            packageIndex++;
          }
        );
      });

      setPackageOptions(allPackages);
      setPackagesLoaded(true);

      // Check for pre-selected package from Zustand store
      if (storeSelectedPackage && storeSelectedPackage.serviceId === serviceId) {
        const matchingPackage = allPackages.find(
          (pkg) =>
            pkg.amount === storeSelectedPackage.quantity &&
            pkg.price === parseFloat(storeSelectedPackage.price)
        );

        if (matchingPackage) {
          setFormData((prev) => ({ ...prev, package: matchingPackage.id }));
          clearSelectedPackage();
          return;
        }

        // No match found — clear the stale store value
        clearSelectedPackage();
      }

      // Set default package (popular or first)
      if (allPackages.length > 0) {
        const popularPackage =
          allPackages.find((pkg) => pkg.popular) || allPackages[0];
        setFormData((prev) => {
          if (!prev.package) {
            return { ...prev, package: popularPackage.id };
          }
          return prev;
        });
      }
    }
  }, [serviceType, currentService?.defaultDelivery, serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const convertPrice = (priceInUsd: string, currencyCode: string): string => {
    const rate =
      exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;
    const format =
      currencyFormats[currencyCode as keyof typeof currencyFormats] ||
      currencyFormats.USD;
    const convertedValue = parseFloat(priceInUsd) * rate;
    const formattedPrice = currency(convertedValue, {
      symbol: format.symbol,
      precision: format.precision,
    });

    if (format.pattern === "#!") {
      return `${formattedPrice.value.toFixed(format.precision)}${
        format.symbol
      }`;
    } else {
      return formattedPrice.format();
    }
  };

  const selectedPackage =
    packageOptions.find((pkg) => pkg.id === formData.package) ||
    packageOptions[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    if (!currentService) return false;

    const newErrors: { link?: string; email?: string } = {};

    if (!formData.link) {
      newErrors.link = "Link is required";
    } else if (!currentService.validation(formData.link)) {
      newErrors.link = currentService.validationMessage;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (validateForm()) {
      const selectedPkg = packageOptions.find(
        (pkg) => pkg.id === formData.package
      );

      if (!selectedPkg) {
        console.error("Selected package not found");
        return;
      }

      const orderDataItem: OrderDataItem = {
        service_id: serviceId,
        product_id: selectedPkg.id,
        user_email: formData.email,
        user_link: formData.link,
        purchase_type: "single",
        product_price: selectedPkg.price.toFixed(2),
      };

      setOrderData([orderDataItem]);

      navigate("/checkout");
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setFormData({
      ...formData,
      package: packageId,
    });
    setShowPackages(false);
  };

  const nextStep = () => {
    if (!currentService) return;

    if (activeStep === 1) {
      if (!formData.link) {
        setErrors({ ...errors, link: "Link is required" });
        return;
      } else if (!currentService.validation(formData.link)) {
        setErrors({ ...errors, link: currentService.validationMessage });
        return;
      }
      setActiveStep(2);
    }
  };

  if (!currentService || !serviceType) {
    return (
      <div className="min-h-screen pt-44 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Service Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The service you&apos;re looking for doesn&apos;t exist. ID:{" "}
            {serviceId}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!packagesLoaded) {
    return (
      <div className="min-h-screen pt-44 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {currentService.title}...</p>
        </div>
      </div>
    );
  }

  if (packageOptions.length === 0) {
    return (
      <div className="min-h-screen pt-44 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Service Configuration Error
          </h1>
          <p className="text-gray-600 mb-6">
            No packages found for {currentService.title}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-44 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Feature introduction */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Boost Your{" "}
              <span className="text-emerald-600">YouTube Presence</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {currentService.description}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left column: Form */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Progress header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-white text-xl font-semibold">
                      Get {currentService.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-200 animate-pulse"></div>
                      <span className="text-white text-sm font-medium">
                        {onlineUsers} Users Online
                      </span>
                    </div>
                  </div>

                  {/* Step indicator */}
                  <div className="flex items-center mt-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-emerald-600 font-bold text-sm">
                      1
                    </div>
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        activeStep >= 2 ? "bg-white" : "bg-white/40"
                      }`}
                    ></div>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        activeStep >= 2
                          ? "bg-white text-emerald-600"
                          : "bg-white/40 text-white"
                      } font-bold text-sm`}
                    >
                      2
                    </div>
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        activeStep >= 3 ? "bg-white" : "bg-white/40"
                      }`}
                    ></div>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        activeStep >= 3
                          ? "bg-white text-emerald-600"
                          : "bg-white/40 text-white"
                      } font-bold text-sm`}
                    >
                      3
                    </div>
                  </div>
                </div>

                {/* Form content */}
                <form className="p-6" onSubmit={handleSubmit}>
                  {/* Step 1: YouTube Link */}
                  {activeStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Enter your YouTube{" "}
                        {serviceType === "subscribers" ? "channel" : "video"}{" "}
                        link
                      </h3>
                      <p className="text-gray-500 text-sm">
                        We&apos;ll add {currentService.unit.toLowerCase()} to
                        this{" "}
                        {serviceType === "subscribers" ? "channel" : "video"}
                      </p>

                      <div className="relative">
                        <input
                          type="text"
                          name="link"
                          placeholder={currentService.linkPlaceholder}
                          className={`w-full px-4 py-4 bg-gray-50 border ${
                            errors.link ? "border-red-500" : "border-gray-200"
                          } rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                          value={formData.link}
                          onChange={handleChange}
                        />
                        {errors.link && (
                          <div className="text-red-500 text-sm mt-1 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4 mr-1"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {errors.link}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={nextStep}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center"
                      >
                        Continue <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Step 2: Package Selection */}
                  {activeStep === 2 && selectedPackage && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Choose your package
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Select the number of{" "}
                        {currentService.unit.toLowerCase()} you want
                      </p>

                      {/* Package selector button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPackages(!showPackages)}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-left flex items-center justify-between text-gray-800"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                              <TrendingUp size={18} />
                            </div>
                            <div>
                              <span className="block font-medium">
                                {selectedPackage.amount} {currentService.unit}
                              </span>
                              <span className="text-sm text-gray-500">
                                Delivered in {selectedPackage.delivery}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="font-bold text-lg mr-2">
                              {selectedPackage.displayPrice ||
                                selectedCurrency.symbol +
                                  selectedPackage.price.toFixed(2)}
                            </span>
                            <ChevronDown
                              size={20}
                              className={`transition-transform ${
                                showPackages ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Package options dropdown */}
                        {showPackages && (
                          <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-80 overflow-auto">
                            {packageOptions.map((pkg) => (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => handlePackageSelect(pkg.id)}
                                className={`w-full p-4 text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                                  pkg.id === formData.package
                                    ? "bg-emerald-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`mr-3 ${
                                      pkg.popular
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-100 text-gray-700"
                                    } p-2 rounded-lg`}
                                  >
                                    <TrendingUp size={18} />
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        {pkg.amount} {currentService.unit}
                                      </span>
                                      {pkg.popular && (
                                        <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                                          Popular
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      Delivered in {pkg.delivery}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-bold">
                                  {pkg.displayPrice ||
                                    selectedCurrency.symbol +
                                      pkg.price.toFixed(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Email field */}
                      <div className="pt-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Contact information
                        </h3>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            placeholder="Email address"
                            className={`w-full px-4 py-4 bg-gray-50 border ${
                              errors.email
                                ? "border-red-500"
                                : "border-gray-200"
                            } rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                            value={formData.email}
                            onChange={handleChange}
                          />
                          {errors.email && (
                            <div className="text-red-500 text-sm mt-1 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 mr-1"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {errors.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Promotions checkbox */}
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          name="promotions"
                          id="promotions"
                          className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          checked={formData.promotions}
                          onChange={handleChange}
                        />
                        <label
                          htmlFor="promotions"
                          className="text-sm text-gray-600"
                        >
                          Send me special offers and discounts (10% off your
                          next order)
                        </label>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-4 mt-4"
                      >
                        Continue to checkout{" "}
                        <ShoppingCart className="ml-2 w-5 h-5" />
                      </button>
                    </div>
                  )}
                </form>

                {/* Trust badges */}
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-wrap justify-center items-center gap-6 text-gray-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Shield size={16} />
                        <span>Secure Checkout</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} />
                        <span>Fast Delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={16} />
                        <span>24/7 Support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Social proof */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                {/* Testimonial */}
                <div className="relative">
                  <div className="">
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          size={20}
                          className="text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>

                    <p className="text-xl font-medium text-gray-800 mb-6">
                      &quot;Thank you BuyRealViews! I recovered all the lost
                      subscribers from another provider, and the{" "}
                      {currentService.unit.toLowerCase()} I purchased boosted my
                      engagement rates tremendously. My videos are now performing
                      better than ever!&quot;
                    </p>

                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
                        JD
                      </div>
                      <div className="ml-4">
                        <p className="font-bold text-gray-800">John Deere</p>
                        <p className="text-gray-500 text-sm">
                          YouTube Content Creator
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust logos */}
                <div className="mt-8 pt-8">
                  <div className="flex flex-wrap items-center gap-6">
                    <img
                      src="/assets/icons/trustpilot-review.webp"
                      width={152}
                      height={54}
                      alt="Trustpilot rating"
                      className="w-auto"
                    />
                  </div>
                </div>

                {/* Benefits */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-semibold text-lg my-4">
                    Why choose BuyRealViews?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">
                          Real, High-Quality Engagement
                        </h4>
                        <p className="text-gray-500 text-sm mt-1">
                          All {currentService.unit.toLowerCase()} come from real
                          accounts with genuine user activity
                        </p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">Fast Delivery</h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Get your {currentService.unit.toLowerCase()} delivered
                          quickly, with gradual distribution
                        </p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium">24/7 Customer Support</h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Our team is always available to assist with any
                          questions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;
