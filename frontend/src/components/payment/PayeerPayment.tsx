import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface PayeerPaymentProps {
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

interface PayeerPaymentFormData {
  action: string;
  method: string;
  fields: {
    m_shop: string;
    m_orderid: string;
    m_amount: string;
    m_curr: string;
    m_desc: string;
    m_sign: string;
    m_params?: string;
    m_cipher_method?: string;
  };
}

const PayeerPayment: React.FC<PayeerPaymentProps> = ({
  orderData,
  customerDetails,
  onPaymentInitiated,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PayeerPaymentFormData | null>(null);

  const initiatePayeerPayment = async () => {
    try {
      setLoading(true);
      onPaymentInitiated?.();

      // Generate customer ID
      const customer_id = customerDetails.name.slice(0, 3).toUpperCase() + customerDetails.phone.slice(-4);

      const response = await api.post(API_ENDPOINTS.PAYEER_CREATE, {
        order_id: orderData.orderId,
        order_amount: orderData.amount.toFixed(2),
        order_currency: orderData.currency,
        customer_details: {
          customer_id,
          customer_name: customerDetails.name.trim(),
          customer_email: customerDetails.email.trim(),
          customer_phone: customerDetails.phone.trim(),
        },
        order_description: orderData.description || 'BuyRealViews Order',
        return_url: `${window.location.origin}/checkout/check-status/${orderData.orderId}`,
      });
      const data = response.data;
      console.log('Payeer payment data:', data);

      if (data.success && data.payment_form) {
        setPaymentForm(data.payment_form);
        
        // Auto-submit the form after a short delay to show loading state
        setTimeout(() => {
          const form = document.getElementById('payeer-payment-form') as HTMLFormElement;
          if (form) {
            form.submit();
          }
        }, 1000);
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (error) {
      console.error('Payeer payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      onPaymentError?.(errorMessage);
      setLoading(false);
    }
  };

  // If payment form is ready, render the auto-submitting form
  if (paymentForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <Loader className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-800 font-medium">Redirecting to Payeer...</p>
            <p className="text-sm text-blue-600">Please wait while we redirect you to the payment page.</p>
          </div>
        </div>

        {/* Hidden auto-submitting form */}
        <form
          id="payeer-payment-form"
          action={paymentForm.action}
          method={paymentForm.method}
          style={{ display: 'none' }}
        >
          {Object.entries(paymentForm.fields).map(([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={value}
            />
          ))}
        </form>

        {/* Manual submit button as fallback */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById('payeer-payment-form') as HTMLFormElement;
              if (form) form.submit();
            }}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Click here if you are not redirected automatically
          </button>
        </div>
      </div>
    );
  }

  // Initial payment button
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Payeer Payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          You will be redirected to Payeer's secure payment page to complete your transaction.
        </p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-medium">{orderData.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">
              {orderData.currency} {orderData.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium">Payeer</span>
          </div>
        </div>
      </div>

      <button
        onClick={initiatePayeerPayment}
        disabled={loading}
        className={`w-full font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center ${
          loading
            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin mr-2 h-4 w-4" />
            Preparing Payment...
          </>
        ) : (
          'Pay with Payeer'
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>
          By clicking "Pay with Payeer", you agree to be redirected to Payeer's secure payment page.
        </p>
      </div>
    </div>
  );
};

export default PayeerPayment;