import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface SessionInfo {
  order_id?: string;
  order_amount?: number;
  currency?: string;
}

const StripeCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkSessionStatus(sessionId);
    }
  }, [sessionId]);

  const checkSessionStatus = async (id: string) => {
    try {
      const response = await api.get<SessionInfo>(`${API_ENDPOINTS.PAYMENT_VERIFY}?method=stripe&sessionId=${id}`);
      setSessionInfo(response.data);
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  const handleRetryPayment = () => {
    if (sessionInfo?.order_id) {
      navigate(`/checkout?retry=${sessionInfo.order_id}`);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600">Your payment was cancelled. Don't worry, you haven't been charged.</p>
          </div>

          {sessionInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">Cancelled Payment Session</p>
                  <div className="text-red-700 space-y-1">
                    {sessionInfo.order_id && (
                      <p>Order ID: <span className="font-mono text-xs">{sessionInfo.order_id}</span></p>
                    )}
                    {sessionInfo.order_amount && (
                      <p>Amount: {sessionInfo.currency || 'USD'} {sessionInfo.order_amount.toFixed(2)}</p>
                    )}
                    {sessionId && <p>Session ID: <span className="font-mono text-xs">{sessionId}</span></p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">What happened?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start"><span className="text-red-500 mr-2">•</span>You cancelled the payment on Stripe's checkout page</li>
              <li className="flex items-start"><span className="text-green-500 mr-2">•</span>No charges have been made to your payment method</li>
              <li className="flex items-start"><span className="text-blue-500 mr-2">•</span>Your order is still pending and can be completed</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button onClick={handleRetryPayment} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Payment Again
            </button>
            <button onClick={() => navigate('/checkout')} className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Checkout
            </button>
            <button onClick={() => navigate('/')} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-2">Need Help?</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>If you're having trouble completing your payment:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check your internet connection</li>
                <li>Try a different payment method</li>
                <li>Clear your browser cache</li>
                <li>Contact our support team</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500 border-t pt-4">
            <p>Still having issues?</p>
            <p className="font-medium">Contact Support: support@glowapex.com</p>
            {sessionId && <p className="mt-1">Reference: {sessionId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCancel;
