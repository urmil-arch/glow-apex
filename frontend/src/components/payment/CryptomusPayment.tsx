import React, { useState } from 'react';
import { Loader, Bitcoin, Zap, Shield, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface CryptomusPaymentProps {
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

interface CryptomusPaymentResponse {
  success: boolean;
  payment_url: string;
  invoice_id: string;
  order_id: string;
  amount: string;
  currency: string;
  payer_currency?: string;
  payer_amount?: string;
  payment_status: string;
  address?: string;
  network?: string;
  expired_at: number;
  created_at: string;
  description: string;
}

const CryptomusPayment: React.FC<CryptomusPaymentProps> = ({
  orderData,
  customerDetails,
  onPaymentInitiated,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');

  // Popular cryptocurrencies for user selection
  const popularCryptos = [
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'USDT', name: 'Tether USD', icon: '₮' },
    { code: 'USDC', name: 'USD Coin', icon: '$' },
    { code: 'LTC', name: 'Litecoin', icon: 'Ł' },
    { code: 'BCH', name: 'Bitcoin Cash', icon: '₿' },
  ];

  const initiateCryptomusPayment = async () => {
    try {
      setLoading(true);
      onPaymentInitiated?.();

      // Generate customer ID
      const customer_id = customerDetails.name.slice(0, 3).toUpperCase() + customerDetails.phone.slice(-4);

      // Prepare request data
      const requestData = {
        order_id: orderData.orderId,
        order_amount: orderData.amount.toFixed(8),
        order_currency: orderData.currency,
        customer_details: {
          customer_id,
          customer_name: customerDetails.name.trim(),
          customer_email: customerDetails.email.trim(),
          customer_phone: customerDetails.phone.trim(),
        },
        order_description: orderData.description || 'BuyRealViews Order',
        return_url: `${window.location.origin}/checkout/check-status/${orderData.orderId}`,
        ...(selectedCrypto && { crypto_currency: selectedCrypto })
      };

      console.log('Creating Cryptomus payment with data:', requestData);

      const response = await api.post<CryptomusPaymentResponse>(API_ENDPOINTS.CRYPTOMUS_CREATE, requestData);
      const data = response.data;
      console.log('Cryptomus payment data:', data);

      if (data.success && data.payment_url) {
        setPaymentUrl(data.payment_url);
        
        // Redirect to payment page after a short delay
        setTimeout(() => {
          window.open(data.payment_url, '_blank', 'noopener,noreferrer');
        }, 1000);
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (error) {
      console.error('Cryptomus payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      onPaymentError?.(errorMessage);
      setLoading(false);
    }
  };

  // If payment URL is ready, show redirect message
  if (paymentUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <Bitcoin className="h-12 w-12 text-orange-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Redirecting to Crypto Payment...</h3>
            <p className="text-orange-700 mb-3">Please complete your payment on the secure crypto payment page.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
              <Loader className="animate-spin h-4 w-4" />
              <span>Opening payment page...</span>
            </div>
          </div>
        </div>

        {/* Manual redirect button as fallback */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 underline text-sm font-medium"
          >
            <Globe className="h-4 w-4" />
            Click here if you are not redirected automatically
          </button>
        </div>
      </div>
    );
  }

  // Main payment interface
  return (
    <div className="space-y-6">
      {/* Crypto selection */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
        <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
          <Bitcoin className="h-5 w-5" />
          Choose Cryptocurrency (Optional)
        </h3>
        <p className="text-sm text-orange-700 mb-4">
          Select your preferred cryptocurrency or leave empty to choose during payment.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedCrypto('')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedCrypto === '' 
                ? 'border-orange-300 bg-orange-100 text-orange-800' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200'
            }`}
          >
            <div className="font-medium text-sm">Any Crypto</div>
            <div className="text-xs text-gray-500">Choose later</div>
          </button>
          
          {popularCryptos.map((crypto) => (
            <button
              key={crypto.code}
              onClick={() => setSelectedCrypto(crypto.code)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedCrypto === crypto.code 
                  ? 'border-orange-300 bg-orange-100 text-orange-800' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{crypto.icon}</span>
                <div>
                  <div className="font-medium text-sm">{crypto.code}</div>
                  <div className="text-xs text-gray-500">{crypto.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Crypto Payment Details</h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{orderData.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">
              {orderData.currency} {orderData.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium">Cryptocurrency</span>
          </div>
          {selectedCrypto && (
            <div className="flex justify-between">
              <span>Preferred Crypto:</span>
              <span className="font-medium">{selectedCrypto}</span>
            </div>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Crypto Payment Benefits
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Fast and secure transactions</span>
          </li>
          <li className="flex items-start gap-2">
            <Globe className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Global payments without borders</span>
          </li>
          <li className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Enhanced privacy and security</span>
          </li>
          <li className="flex items-start gap-2">
            <Bitcoin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Support for 20+ cryptocurrencies</span>
          </li>
        </ul>
      </div>

      {/* Pay button */}
      <button
        onClick={initiateCryptomusPayment}
        disabled={loading}
        className={`w-full font-bold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-3 ${
          loading
            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin h-5 w-5" />
            <span>Preparing Payment...</span>
          </>
        ) : (
          <>
            <Bitcoin className="h-5 w-5" />
            <span>Pay with Cryptocurrency</span>
          </>
        )}
      </button>

      {/* Security notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          🔒 Your payment is secured by Cryptomus. You will be redirected to their secure payment page.
        </p>
      </div>
    </div>
  );
};

export default CryptomusPayment;
