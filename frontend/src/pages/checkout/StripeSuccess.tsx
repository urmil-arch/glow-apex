import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';
import { useAuth } from '@/context/AuthContext';

interface PaymentVerificationResult {
  order_id: string;
  session_id: string;
  order_status: string;
  order_amount: number;
  payment_method: string;
  transaction_time: string;
  currency: string;
  payment_gateway: string;
}

const StripeSuccess: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  if (!authLoading && !isAuthenticated) return <Navigate to="/sign-in" replace />;
  const [verification, setVerification] = useState<PaymentVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async (id: string) => {
    try {
      const response = await api.get<PaymentVerificationResult>(
        `${API_ENDPOINTS.PAYMENT_VERIFY}?method=stripe&sessionId=${id}`
      );
      setVerification(response.data);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'PENDING': return <Loader className="w-16 h-16 text-yellow-500 animate-spin" />;
      case 'FAILED': return <XCircle className="w-16 h-16 text-red-500" />;
      default: return <AlertTriangle className="w-16 h-16 text-orange-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PAID': return { title: 'Payment Successful!', message: 'Your payment has been processed successfully.', color: 'text-green-600' };
      case 'PENDING': return { title: 'Payment Processing...', message: 'Your payment is being processed. Please wait a moment.', color: 'text-yellow-600' };
      case 'FAILED': return { title: 'Payment Failed', message: 'Your payment could not be processed. Please try again.', color: 'text-red-600' };
      default: return { title: 'Payment Status Unknown', message: 'We are checking your payment status.', color: 'text-orange-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment...</h1>
            <p className="text-gray-600">Please wait while we confirm your payment with Stripe.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-red-600 mb-2">Verification Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                Try Again
              </button>
              <button onClick={() => navigate('/')} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition">
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const statusInfo = getStatusMessage(verification.order_status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4">{getStatusIcon(verification.order_status)}</div>
            <h1 className={`text-2xl font-bold mt-4 mb-2 ${statusInfo.color}`}>{statusInfo.title}</h1>
            <p className="text-gray-600">{statusInfo.message}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs">{verification.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-green-600">{verification.currency} {verification.order_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>{verification.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Time:</span>
                <span>{new Date(verification.transaction_time).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Session ID:</span>
                <span className="font-mono text-xs">{verification.session_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${statusInfo.color}`}>{verification.order_status}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {verification.order_status === 'PAID' && (
              <>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold">
                  View Dashboard
                </button>
                <button onClick={() => navigate('/')} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition">
                  Continue Shopping
                </button>
              </>
            )}
            {verification.order_status === 'PENDING' && (
              <>
                <button onClick={() => window.location.reload()} className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg hover:bg-yellow-700 transition">
                  Refresh Status
                </button>
                <button onClick={() => navigate(`/checkout/check-status/${verification.order_id}`)} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  Check Order Status
                </button>
              </>
            )}
            {verification.order_status === 'FAILED' && (
              <>
                <button onClick={() => navigate('/checkout')} className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition">
                  Try Again
                </button>
                <button onClick={() => navigate('/')} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition">
                  Go Home
                </button>
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Need help? Contact our support team</p>
            <p>Reference: {verification.session_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeSuccess;
