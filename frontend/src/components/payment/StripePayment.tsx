import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface StripePaymentProps {
  orderData: {
    orderId: string;
    amount: number;
    currency: string;
    description?: string;
  };
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  onPaymentInitiated?: () => void;
  onPaymentError?: (error: string) => void;
}

interface StripePaymentResponse {
  success: boolean;
  session_id: string;
  checkout_url: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  expires_at: number;
  created_at: number;
  description?: string;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  orderData,
  customerDetails,
  onPaymentInitiated,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const initiateStripePayment = async () => {
    try {
      setLoading(true);
      onPaymentInitiated?.();

      // Generate customer ID
      const customer_id = 
        customerDetails.name.slice(0, 3).toUpperCase() + 
        customerDetails.phone.slice(-4);

      console.log('🚀 Initiating Stripe payment...');

      const response = await api.post<StripePaymentResponse>(API_ENDPOINTS.STRIPE_CREATE, {
        order_id: orderData.orderId,
        order_amount: orderData.amount.toFixed(2),
        order_currency: orderData.currency,
        customer_details: {
          customer_id,
          customer_name: customerDetails.name.trim(),
          customer_email: customerDetails.email.trim(),
          customer_phone: customerDetails.phone.trim(),
        },
        order_description: orderData.description || "BuyRealViews Order",
        return_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
        payment_method_types: ['card'],
      });

      const data = response.data;
      console.log("✅ Stripe payment response:", data);

      if (data.success && data.checkout_url) {
        console.log('🔗 Checkout URL:', data.checkout_url);
        console.log('🆔 Session ID:', data.session_id);
        
        setRedirecting(true);
        
        // Show redirecting state briefly, then redirect
        setTimeout(() => {
          console.log('🚀 Redirecting to Stripe checkout...');
          
          // THIS IS THE KEY LINE - REDIRECT TO STRIPE
          window.location.href = data.checkout_url;
          
        }, 1500);
        
      } else {
        throw new Error("Invalid response from Stripe payment service");
      }
      
    } catch (error) {
      console.error("❌ Stripe payment error:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Payment initialization failed";
      onPaymentError?.(errorMessage);
      setLoading(false);
      setRedirecting(false);
    }
  };

  // If redirecting to Stripe, show the redirecting state
  if (redirecting) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-800 font-medium text-lg mb-2">
              Redirecting to Stripe...
            </p>
            <p className="text-sm text-blue-600">
              Please wait while we redirect you to Stripe's secure checkout page.
            </p>
            <div className="mt-4 text-xs text-blue-500">
              <p>🔒 Your payment will be processed securely by Stripe</p>
            </div>
          </div>
        </div>

        {/* Manual redirect button as fallback */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Not redirected automatically?
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
          >
            Click here to try again
          </button>
        </div>
      </div>
    );
  }

  // Initial payment button
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">💳</span>
          </div>
          <h3 className="font-medium text-gray-900">Stripe Payment</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          You will be redirected to Stripe's secure payment page where you can pay with:
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-white px-2 py-1 rounded border">💳 Credit Cards</span>
          <span className="text-xs bg-white px-2 py-1 rounded border">🍎 Apple Pay</span>
          <span className="text-xs bg-white px-2 py-1 rounded border">📱 Google Pay</span>
          <span className="text-xs bg-white px-2 py-1 rounded border">💰 PayPal</span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-mono text-xs">{orderData.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium text-green-600">
              {orderData.currency} {orderData.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium">Stripe</span>
          </div>
        </div>
      </div>

      <button
        onClick={initiateStripePayment}
        disabled={loading}
        className={`w-full font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center ${
          loading
            ? "bg-gray-400 cursor-not-allowed text-gray-600"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin mr-2 h-5 w-5" />
            Creating Payment Session...
          </>
        ) : (
          <>
            <span className="mr-2">🚀</span>
            Pay with Stripe
          </>
        )}
      </button>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>
          🔒 <strong>Secure Payment:</strong> Your payment is processed securely by Stripe
        </p>
        <p>
          By clicking "Pay with Stripe", you agree to be redirected to Stripe's secure checkout page.
        </p>
      </div>
      
      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded mt-2">
          <p><strong>Debug Info:</strong></p>
          <p>Order: {orderData.orderId}</p>
          <p>Amount: {orderData.currency} {orderData.amount}</p>
          <p>Customer: {customerDetails.email}</p>
        </div>
      )}
    </div>
  );
};

export default StripePayment;
