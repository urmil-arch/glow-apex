import { useState, useEffect } from "react";
import { v4 } from "uuid";
import PayeerPayment from "@/components/payment/PayeerPayment";
import CryptomusPayment from "@/components/payment/CryptomusPayment";
import currency from "currency.js";
import { Loader } from "lucide-react";
import StripePayment from "@/components/payment/StripePayment";
import { useOrderStore } from "@/store/useOrderStore";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

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

const serviceConfig = {
  "2342": {
    name: "YouTube Likes",
    unit: "Likes",
    type: "video",
    benefits: [
      "Real & Organic Likes",
      "High Retention",
      "Delivery starts within minutes",
      "No Fallen Off Likes",
      "24/7 Customer Support",
    ],
  },
  "5648": {
    name: "YouTube Views",
    unit: "Views",
    type: "video",
    benefits: [
      "Real & Organic Views",
      "High Retention",
      "Delivery starts within minutes",
      "No Dropped Views",
      "24/7 Customer Support",
    ],
  },
  "5649": {
    name: "YouTube Comments",
    unit: "Comments",
    type: "video",
    benefits: [
      "Real & Authentic Comments",
      "Custom Comment Options",
      "Delivery starts within hours",
      "Professional Comments",
      "24/7 Customer Support",
    ],
  },
  "376": {
    name: "YouTube Subscribers",
    unit: "Subscribers",
    type: "channel",
    benefits: [
      "Real & Active Subscribers",
      "High Retention Rate",
      "Delivery starts within hours",
      "No Dropped Subscribers",
      "24/7 Customer Support",
    ],
  },
};

const serviceAddOns = {
  "2342": [
    {
      id: "addon1",
      name: "+ 100 extra Likes",
      description: "Boost your engagement",
      price: 4.99,
      selected: false,
    },
    {
      id: "addon2",
      name: "+ 250 extra Likes",
      description: "Maximum impact",
      price: 8.98,
      selected: false,
    },
    {
      id: "addon3",
      name: "+ 40 Comments",
      description: "Add relevant comments",
      price: 12.99,
      selected: false,
    },
  ],
  "5648": [
    {
      id: "addon1",
      name: "+ 1000 extra Views",
      description: "Boost your reach",
      price: 6.99,
      selected: false,
    },
    {
      id: "addon2",
      name: "+ 2500 extra Views",
      description: "Maximum visibility",
      price: 14.99,
      selected: false,
    },
    {
      id: "addon3",
      name: "+ 50 Likes",
      description: "Add engagement",
      price: 8.99,
      selected: false,
    },
  ],
  "5649": [
    {
      id: "addon1",
      name: "+ 20 extra Comments",
      description: "More engagement",
      price: 15.99,
      selected: false,
    },
    {
      id: "addon2",
      name: "+ 50 extra Comments",
      description: "Maximum interaction",
      price: 34.99,
      selected: false,
    },
    {
      id: "addon3",
      name: "+ 100 Likes",
      description: "Boost overall engagement",
      price: 7.99,
      selected: false,
    },
  ],
  "376": [
    {
      id: "addon1",
      name: "+ 50 extra Subscribers",
      description: "Grow your audience",
      price: 19.99,
      selected: false,
    },
    {
      id: "addon2",
      name: "+ 100 extra Subscribers",
      description: "Maximum growth",
      price: 34.99,
      selected: false,
    },
    {
      id: "addon3",
      name: "+ 500 Views",
      description: "Boost channel visibility",
      price: 9.99,
      selected: false,
    },
  ],
};

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface ServiceInfo {
  name: string;
  unit: string;
  type: string;
  benefits: string[];
}

const PaymentOptionTrigger = ({
  isActive,
  title,
  description,
  onClick,
}: {
  isActive: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  return (
    <div
      className={`p-4 cursor-pointer rounded-t-xl border-b ${
        isActive ? "bg-emerald-50 border-emerald-300" : "bg-white"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
            isActive ? "border-emerald-500" : "border-gray-300"
          }`}
        >
          {isActive && (
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{title}</p>
          <span className="text-sm text-gray-600 mt-1 block">{description}</span>
        </div>
      </div>
    </div>
  );
};

interface OrderData {
  service_id: string;
  product_id: string;
  user_email: string;
  user_link: string;
  purchase_type: string;
  product_price: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  displayPrice?: string;
  selected: boolean;
}

const CheckoutPage = () => {
  const { orderData: storeOrderData } = useOrderStore();

  const [activePayment, setActivePayment] = useState<string | null>("option1");
  const [orderData, setOrderData] = useState<OrderData[] | null>([]);
  const [subtotalAmount, setSubtotalAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [transactionFee] = useState<number>(0.5);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: "USD",
    symbol: "$",
    name: "USD",
  });

  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const [currentService, setCurrentService] = useState<ServiceInfo | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  const convertPrice = (
    priceInUsd: number | string,
    currencyCode: string
  ): string => {
    const priceString =
      typeof priceInUsd === "number" ? priceInUsd.toString() : priceInUsd;
    const rate =
      exchangeRates[currencyCode as keyof typeof exchangeRates] || 1;
    const format =
      currencyFormats[currencyCode as keyof typeof currencyFormats] ||
      currencyFormats.USD;
    const convertedValue = parseFloat(priceString) * rate;
    const formattedPrice = currency(convertedValue, {
      symbol: format.symbol,
      precision: format.precision,
    });

    if (format.pattern === "#!") {
      return `${formattedPrice.value.toFixed(format.precision)}${format.symbol}`;
    } else {
      return formattedPrice.format();
    }
  };

  const calculateTotals = (
    orderDataValue: OrderData[] | null,
    currentAddOns: AddOn[]
  ) => {
    let baseSubtotal = 0;
    if (orderDataValue && orderDataValue.length > 0) {
      baseSubtotal = orderDataValue.reduce((sum, item) => {
        return sum + parseFloat(item.product_price);
      }, 0);
    }

    const addOnsSubtotal = currentAddOns
      .filter((addon) => addon.selected)
      .reduce((sum, addon) => sum + addon.price, 0);

    const newSubtotal = baseSubtotal + addOnsSubtotal;
    setSubtotalAmount(newSubtotal);
    setTotalAmount(newSubtotal + transactionFee - discount);
  };

  // Load order data from Zustand store and detect service
  useEffect(() => {
    if (storeOrderData && storeOrderData.length > 0) {
      setOrderData(storeOrderData);

      const serviceId = storeOrderData[0].service_id;
      const detectedService =
        serviceConfig[serviceId as keyof typeof serviceConfig];

      if (detectedService) {
        setCurrentService(detectedService);

        const serviceSpecificAddOns =
          serviceAddOns[serviceId as keyof typeof serviceAddOns] || [];
        setAddOns(serviceSpecificAddOns);
        calculateTotals(storeOrderData, serviceSpecificAddOns);
      } else {
        console.warn("Unknown service ID:", serviceId);
        setCurrentService(serviceConfig["2342"]);
        setAddOns(serviceAddOns["2342"]);
        calculateTotals(storeOrderData, serviceAddOns["2342"]);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle add-on selection
  const toggleAddOn = (id: string) => {
    const updatedAddOns = addOns.map((addon) =>
      addon.id === id ? { ...addon, selected: !addon.selected } : addon
    );
    setAddOns(updatedAddOns);
    calculateTotals(orderData, updatedAddOns);
  };

  // Handle promo code application
  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "save10") {
      const discountAmount = subtotalAmount * 0.1;
      setDiscount(discountAmount);
      setTotalAmount(subtotalAmount + transactionFee - discountAmount);
    } else {
      setDiscount(0);
      setTotalAmount(subtotalAmount + transactionFee);
    }
  };

  const handlePaymentSelect = (option: string) => {
    setActivePayment(option);
  };

  const paymentOptions = [
    {
      id: "option1",
      title: "Cashfree",
      description:
        "Accepts most card brands, including Amex, Visa, MasterCard, Discover and JCB. Not available for US-issued cards.",
    },
    {
      id: "option3",
      title: "Cryptomus",
      description:
        "Pay with Bitcoin, Ethereum, USDT, and 20+ other cryptocurrencies. Fast, secure, and global crypto payments.",
    },
    {
      id: "option4",
      title: "Stripe",
      description:
        "Accepts most card brands, including Amex, Visa, MasterCard, Discover and JCB.",
    },
    {
      id: "option5",
      title: "Bank Transfer",
      description:
        "Direct bank transfer option for payments. Processing may take 1-2 business days.",
    },
  ];

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

    const userCurrency = localStorage.getItem("user_currency");
    if (userCurrency) {
      try {
        const parsedCurrency = JSON.parse(userCurrency);
        if (parsedCurrency && parsedCurrency.code && parsedCurrency.symbol) {
          setSelectedCurrency(parsedCurrency);
        }
      } catch (error) {
        console.error("Error parsing user_currency from localStorage:", error);
      }
    }
  }, []);

  // Update add-ons with converted prices when currency changes
  useEffect(() => {
    if (addOns.length > 0) {
      const updatedAddOns = addOns.map((addon) => ({
        ...addon,
        displayPrice: convertPrice(addon.price, selectedCurrency.code),
      }));
      setAddOns(updatedAddOns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency]);

  const convertToINRForPayment = (usdAmount: number): number => {
    const inrRate = exchangeRates.INR;
    const inrAmount = usdAmount * inrRate;
    return Math.round(inrAmount * 100) / 100;
  };

  const isFormValid =
    userDetails.name.trim() &&
    userDetails.email.trim() &&
    userDetails.phone.trim() &&
    /\S+@\S+\.\S+/.test(userDetails.email);

  const validateUserDetails = (): boolean => {
    if (!userDetails.name.trim()) {
      alert("Please enter your name");
      return false;
    }
    if (!userDetails.email.trim()) {
      alert("Please enter your email address");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(userDetails.email)) {
      alert("Please enter a valid email address");
      return false;
    }
    if (!userDetails.phone.trim()) {
      alert("Please enter your phone number");
      return false;
    }
    if (userDetails.phone.length < 10) {
      alert("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateUserDetails()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const customer_id =
        userDetails.name.slice(0, 3).toUpperCase() +
        userDetails.phone.slice(-4);
      const orderid = `order_${v4()}`;

      const totalAmountInINR = convertToINRForPayment(totalAmount);

      const response = await api.post(API_ENDPOINTS.CASHFREE_CREATE, {
        order_id: orderid,
        order_amount: totalAmountInINR.toString(),
        order_currency: "INR",
        customer_details: {
          customer_id: customer_id,
          customer_name: userDetails.name.trim(),
          customer_email: userDetails.email.trim(),
          customer_phone: userDetails.phone.trim(),
        },
        order_meta: {
          return_url: `${window.location.origin}/checkout/check-status/${orderid}`,
        },
      });

      if (response.status !== 200) {
        throw new Error("Error while creating payment order");
      }

      window.open(
        `${window.location.origin}/payment/create/${response.data.payment_session_id}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Payment error:", error);
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    alert(`Payment error: ${error}`);
    setLoading(false);
  };

  const handlePaymentInitiated = () => {
    setLoading(true);
  };

  if (!currentService) {
    return (
      <div className="container pb-32 pt-44">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-32 pt-44">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-dvh">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            {paymentOptions.map((option) => (
              <div key={option.id}>
                <PaymentOptionTrigger
                  isActive={activePayment === option.id}
                  title={option.title}
                  description={option.description}
                  onClick={() => handlePaymentSelect(option.id)}
                />

                {activePayment === option.id && (
                  <div className="p-6 bg-white border-t border-gray-100">
                    {/* Payeer Payment Option */}
                    {option.id === "option2" ? (
                      <div className="space-y-4">
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> All fields marked with{" "}
                            <span className="text-red-500">*</span> are required
                            to process your payment.
                          </p>
                        </div>

                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    name: e.target.value,
                                  })
                                }
                                value={userDetails.name}
                                type="text"
                                placeholder="Your full name"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Phone Number{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    phone: e.target.value,
                                  })
                                }
                                value={userDetails.phone}
                                type="tel"
                                placeholder="+91 123 454 5698"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    email: e.target.value,
                                  })
                                }
                                value={userDetails.email}
                                type="email"
                                placeholder="jhon.doe@gmail.com"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </form>

                        {isFormValid && (
                          <PayeerPayment
                            orderData={{
                              orderId: `order_${v4()}`,
                              amount: totalAmount,
                              currency: "USD",
                              description: `Glow-Apex - ${currentService.name}`,
                            }}
                            customerDetails={userDetails}
                            onPaymentInitiated={handlePaymentInitiated}
                            onPaymentError={handlePaymentError}
                          />
                        )}
                      </div>
                    ) : option.id === "option3" ? (
                      /* Cryptomus Payment Option */
                      <div className="space-y-4">
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Crypto Payment:</strong> All fields marked
                            with <span className="text-red-500">*</span> are
                            required. You can pay with Bitcoin, Ethereum, USDT,
                            and 20+ other cryptocurrencies.
                          </p>
                        </div>

                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    name: e.target.value,
                                  })
                                }
                                value={userDetails.name}
                                type="text"
                                placeholder="Your full name"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Phone Number{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    phone: e.target.value,
                                  })
                                }
                                value={userDetails.phone}
                                type="tel"
                                placeholder="+91 123 454 5698"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    email: e.target.value,
                                  })
                                }
                                value={userDetails.email}
                                type="email"
                                placeholder="jhon.doe@gmail.com"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                            </div>
                          </div>
                        </form>

                        {isFormValid && (
                          <CryptomusPayment
                            orderData={{
                              orderId: `order_${v4()}`,
                              amount: totalAmount,
                              currency: "USD",
                              description: `Glow-Apex - ${currentService.name}`,
                            }}
                            customerDetails={userDetails}
                            onPaymentInitiated={handlePaymentInitiated}
                            onPaymentError={handlePaymentError}
                          />
                        )}
                      </div>
                    ) : option.id === "option4" ? (
                      /* Stripe Payment Option */
                      <div className="space-y-4">
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> All fields marked with{" "}
                            <span className="text-red-500">*</span> are required
                            to process your payment.
                          </p>
                        </div>

                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    name: e.target.value,
                                  })
                                }
                                value={userDetails.name}
                                type="text"
                                placeholder="Your full name"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Phone Number{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    phone: e.target.value,
                                  })
                                }
                                value={userDetails.phone}
                                type="tel"
                                placeholder="+91 123 454 5698"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    email: e.target.value,
                                  })
                                }
                                value={userDetails.email}
                                type="email"
                                placeholder="jhon.doe@gmail.com"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </form>

                        {isFormValid && (
                          <StripePayment
                            orderData={{
                              orderId: `order_${v4()}`,
                              amount: totalAmount,
                              currency: "USD",
                              description: `Glow-Apex - ${currentService.name}`,
                            }}
                            customerDetails={userDetails}
                            onPaymentInitiated={handlePaymentInitiated}
                            onPaymentError={handlePaymentError}
                          />
                        )}
                      </div>
                    ) : (
                      /* Default payment form for Cashfree / Bank Transfer */
                      <div>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> All fields marked with{" "}
                            <span className="text-red-500">*</span> are required
                            to process your payment.
                          </p>
                        </div>
                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Cardholder Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    name: e.target.value,
                                  })
                                }
                                value={userDetails.name}
                                type="text"
                                placeholder="Name on card"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Phone Number{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    phone: e.target.value,
                                  })
                                }
                                value={userDetails.phone}
                                type="tel"
                                placeholder="+91 123 454 5698"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                onChange={(e) =>
                                  setUserDetails({
                                    ...userDetails,
                                    email: e.target.value,
                                  })
                                }
                                value={userDetails.email}
                                type="email"
                                placeholder="jhon.doe@gmail.com"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-8">
            {/* YouTube logo/username header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  width="20"
                  height="20"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-500">
                  {currentService.type === "channel"
                    ? "YouTube Channel"
                    : "YouTube Video"}
                </p>
                <p className="font-semibold truncate max-w-[200px]">
                  {orderData && orderData[0]?.user_link
                    ? (() => {
                        try {
                          return (
                            new URL(orderData[0].user_link).pathname
                              .split("/")
                              .pop() || "YouTube User"
                          );
                        } catch {
                          return "YouTube User";
                        }
                      })()
                    : "YouTube User"}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {orderData &&
              orderData.map((item, index) => (
                <div key={index} className="py-4 border-b border-gray-100">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{currentService.name}</span>
                    <span>
                      {convertPrice(item.product_price, selectedCurrency.code)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {item.user_link}
                  </div>
                </div>
              ))}

            {/* Add-on options */}
            {addOns.length > 0 && (
              <div className="py-4 border-b border-gray-100">
                <h3 className="font-medium mb-3">Add-ons</h3>

                {addOns.map((addon) => (
                  <div
                    key={addon.id}
                    className={`flex items-center justify-between mb-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      addon.selected
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleAddOn(addon.id)}
                  >
                    <div>
                      <p className="font-medium">{addon.name}</p>
                      <p className="text-sm text-gray-600">{addon.description}</p>
                    </div>
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        addon.selected
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }`}
                    >
                      {addon.selected
                        ? "Added"
                        : `+${
                            addon.displayPrice ||
                            convertPrice(addon.price, selectedCurrency.code)
                          }`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Promo code section */}
            <div className="py-4 border-b border-gray-100">
              <h3 className="font-medium mb-3">Promo Code</h3>
              <div className="flex sm:flex-row flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  onClick={applyPromoCode}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply
                </button>
              </div>
              {discount > 0 && (
                <p className="text-sm text-emerald-600 mt-2">
                  Promo code applied successfully!
                </p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>
                  {convertPrice(subtotalAmount, selectedCurrency.code)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-emerald-600">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Transaction Fee</span>
                <span>
                  {convertPrice(transactionFee, selectedCurrency.code)}
                </span>
              </div>

              {/* Show INR conversion note if user is viewing in different currency */}
              {selectedCurrency.code !== "INR" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Payment Note:</strong> You will be charged{" "}
                    <strong>
                      ₹
                      {convertToINRForPayment(totalAmount).toLocaleString(
                        "en-IN"
                      )}
                    </strong>{" "}
                    (INR) for this order. Your card will be charged in Indian
                    Rupees.
                  </p>
                </div>
              )}

              {/* Payment button for Cashfree / Bank Transfer */}
              {activePayment !== "option2" &&
                activePayment !== "option3" &&
                activePayment !== "option4" && (
                  <button
                    disabled={loading || !isFormValid}
                    onClick={handleCheckout}
                    type="submit"
                    className={`w-full font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-between mt-4 ${
                      loading || !isFormValid
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <Loader className="animate-spin mx-auto" />
                    ) : !isFormValid ? (
                      <span className="mx-auto">
                        Complete All Required Fields
                      </span>
                    ) : (
                      <>
                        <span className="font-bold">Pay</span>
                        <span className="font-bold text-xl">
                          {convertPrice(totalAmount, selectedCurrency.code)}
                        </span>
                      </>
                    )}
                  </button>
                )}

              {/* Total amount info for Payeer / Stripe */}
              {(activePayment === "option2" || activePayment === "option4") && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount:</span>
                    <span className="font-bold text-xl text-emerald-600">
                      {convertPrice(totalAmount, selectedCurrency.code)}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700 mt-2">
                    Complete the form above to proceed with Payeer payment.
                  </p>
                </div>
              )}

              {/* Total amount info for Cryptomus */}
              {activePayment === "option3" && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount:</span>
                    <span className="font-bold text-xl text-orange-600">
                      {convertPrice(totalAmount, selectedCurrency.code)}
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    Complete the form above to proceed with cryptocurrency
                    payment.
                  </p>
                </div>
              )}
            </div>

            {/* Dynamic Benefits */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">You&apos;ll Get:</h3>
              <ul className="space-y-2">
                {currentService.benefits.map(
                  (benefit: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      <span className="text-sm">
                        <strong>{benefit}</strong>
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
