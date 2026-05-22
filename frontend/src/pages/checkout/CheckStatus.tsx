import axios from "axios";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { API_ENDPOINTS } from "@/config";

interface PaymentStatus {
  order_id: string;
  order_status: "PAID" | "FAILED" | "ACTIVE" | string;
  order_amount: number;
  payment_method?: string;
  transaction_time?: string;
  cf_order_id?: string;
}

const CheckStatus: React.FC = () => {
  const { orderid } = useParams<{ orderid: string }>();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentStatus = async (id: string): Promise<void> => {
    try {
      setLoading(true);

      try {
        const resp = await axios.get<PaymentStatus>(`${API_ENDPOINTS.CASHFREE_VERIFY}?orderId=${id}`);
        setPaymentStatus(resp.data);
        setLoading(false);
        return;
      } catch {
        // fall through to next gateway
      }

      try {
        const resp = await axios.get<PaymentStatus>(`${API_ENDPOINTS.PAYEER_VERIFY}?orderId=${id}`);
        setPaymentStatus(resp.data);
        setLoading(false);
        return;
      } catch {
        // fall through to next gateway
      }

      try {
        const resp = await axios.get<PaymentStatus>(`${API_ENDPOINTS.CRYPTOMUS_VERIFY}?orderId=${id}`);
        setPaymentStatus(resp.data);
        setLoading(false);
        return;
      } catch {
        throw new Error('All payment gateways failed to verify order');
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch payment status");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderid) {
      fetchPaymentStatus(orderid);
    }
  }, [orderid]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const renderStatusCard = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Verifying payment status...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <XCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-xl font-bold mt-4">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => orderid && fetchPaymentStatus(orderid)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!paymentStatus) return null;

    switch (paymentStatus.order_status) {
      case "PAID":
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold mt-4 text-green-600">Payment Successful!</h2>
              <p className="mt-2 text-center text-gray-600">Your payment has been processed successfully.</p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{paymentStatus.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{paymentStatus.order_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{paymentStatus.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Time:</span>
                <span className="font-medium">{formatDate(paymentStatus.transaction_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CF Order ID:</span>
                <span className="font-medium">{paymentStatus.cf_order_id}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      case "FAILED":
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center">
              <XCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold mt-4 text-red-600">Payment Failed</h2>
              <p className="mt-2 text-center text-gray-600">Your payment could not be processed. Please try again.</p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{paymentStatus.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{paymentStatus.order_amount}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => (window.location.href = "/checkout")}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      case "ACTIVE":
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center">
              <Clock className="h-16 w-16 text-yellow-500" />
              <h2 className="text-2xl font-bold mt-4 text-yellow-600">Payment Pending</h2>
              <p className="mt-2 text-center text-gray-600">Your payment is being processed. Please wait...</p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{paymentStatus.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₹{paymentStatus.order_amount}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => orderid && fetchPaymentStatus(orderid)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Check Status
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <h2 className="text-2xl font-bold mt-4 text-gray-700">Unknown Status</h2>
              <p className="mt-2 text-center text-gray-600">Status: {paymentStatus.order_status || "Unknown"}</p>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{paymentStatus.order_id}</span>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container pb-32 pt-44 min-h-dvh flex items-center justify-center bg-gray-50">
      {renderStatusCard()}
    </div>
  );
};

export default CheckStatus;
