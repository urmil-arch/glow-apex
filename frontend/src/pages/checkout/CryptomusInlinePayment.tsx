import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowLeft, CheckCircle, Clock, Copy, ExternalLink, Loader,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

interface CryptomusSession {
  charge: number;
  currency: string;
  description: string;
  cryptomus_address?: string;
  cryptomus_network?: string;
  cryptomus_payer_currency?: string;
  cryptomus_payer_amount?: string;
  cryptomus_payment_url?: string;
  cryptomus_expired_at?: number;
}

interface CryptomusInlinePaymentProps {
  token: string;
  onBack: () => void;
}

type Status = "pending" | "paid" | "failed";

const POLL_INTERVAL_MS = 6000;

// Live countdown to the invoice expiry, formatted mm:ss. Returns null once elapsed.
function useCountdown(expiresAtSeconds?: number): string | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAtSeconds) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(Math.max(0, expiresAtSeconds * 1000 - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtSeconds]);

  if (remaining === null || remaining <= 0) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const CryptomusInlinePayment: React.FC<CryptomusInlinePaymentProps> = ({ token, onBack }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<CryptomusSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("pending");
  const [copied, setCopied] = useState(false);
  const settled = useRef(false);

  const countdown = useCountdown(session?.cryptomus_expired_at);

  // Load the invoice details for this session token.
  useEffect(() => {
    api
      .get<CryptomusSession>(`${API_ENDPOINTS.CHECKOUT_SESSION}/${token}`)
      .then((res) => setSession(res.data))
      .catch(() => setLoadError("This payment session has expired or is invalid. Please start over."));
  }, [token]);

  // Poll the backend for payment confirmation while pending.
  useEffect(() => {
    if (loadError) return;
    const id = setInterval(async () => {
      if (settled.current) return;
      try {
        const res = await api.post<{ status: string }>(API_ENDPOINTS.CHECKOUT_VERIFY_CRYPTOMUS, {
          session_token: token,
        });
        const s = res.data.status;
        if (s === "paid") {
          settled.current = true;
          setStatus("paid");
          clearInterval(id);
          setTimeout(() => navigate("/dashboard/orders"), 1600);
        } else if (s === "failed" || s === "refund" || s === "refunded") {
          settled.current = true;
          setStatus("failed");
          clearInterval(id);
        }
      } catch {
        // Transient network/status error — keep polling.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [token, loadError, navigate]);

  async function copyAddress() {
    if (!session?.cryptomus_address) return;
    try {
      await navigator.clipboard.writeText(session.cryptomus_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the address is selectable in the field as a fallback.
    }
  }

  // ── Terminal / loading states ───────────────────────────────────────────────
  if (loadError) {
    return (
      <StatusCard
        icon={<AlertCircle className="w-7 h-7 text-red-500" />}
        tint="bg-red-50"
        title="Session Expired"
        message={loadError}
        action={{ label: "Back to Checkout", onClick: onBack }}
      />
    );
  }

  if (status === "paid") {
    return (
      <StatusCard
        icon={<CheckCircle className="w-7 h-7 text-emerald-500" />}
        tint="bg-emerald-50"
        title="Payment Confirmed"
        message="Your order has been placed. Redirecting you to your orders…"
      />
    );
  }

  if (status === "failed") {
    return (
      <StatusCard
        icon={<AlertCircle className="w-7 h-7 text-red-500" />}
        tint="bg-red-50"
        title="Payment Failed"
        message="The crypto payment did not complete. No charge was made — you can try again."
        action={{ label: "Back to Checkout", onClick: onBack }}
      />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  const payAmount = session.cryptomus_payer_amount ?? "";
  const payCurrency = session.cryptomus_payer_currency ?? "USDT";
  const network = session.cryptomus_network ?? "TRON (TRC-20)";

  // ── Pending payment instructions ────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Pay with Crypto</p>
          <h2 className="text-xl font-bold text-gray-900">Send {payCurrency} to complete</h2>
          <p className="text-sm text-gray-500 mt-1">{session.description}</p>
        </div>

        {/* Amount */}
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 mb-4">
          <p className="text-xs text-gray-500 mb-0.5">Exact amount to send</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{payAmount} {payCurrency}</span>
            <span className="text-xs text-gray-400">≈ ${session.charge.toFixed(2)} {session.currency}</span>
          </div>
        </div>

        {/* Network */}
        <div className="flex justify-between items-center text-sm mb-2 px-1">
          <span className="text-gray-500">Network</span>
          <span className="font-medium text-gray-900">{network}</span>
        </div>

        {/* Address */}
        <p className="text-xs text-gray-500 mb-1.5 px-1">Wallet address</p>
        <div className="flex items-stretch gap-2 mb-4">
          <input
            readOnly
            value={session.cryptomus_address ?? ""}
            className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-700 truncate focus:outline-none"
          />
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Warning */}
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4">
          Send the <strong>exact amount</strong> on the <strong>{network}</strong> network only. Sending a
          different amount or network may result in lost funds.
        </div>

        {/* Status / countdown */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
          <Loader className="w-4 h-4 animate-spin text-teal-500" />
          Waiting for payment…
          {countdown && (
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" /> {countdown}
            </span>
          )}
        </div>

        {/* Fallback hosted invoice */}
        {session.cryptomus_payment_url && (
          <a
            href={session.cryptomus_payment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-sm text-teal-600 hover:text-teal-700 font-medium py-2"
          >
            Open in Cryptomus (QR & wallet connect) <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};

interface StatusCardProps {
  icon: React.ReactNode;
  tint: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, tint, title, message, action }) => (
  <div className="max-w-md mx-auto">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
      <div className={`w-14 h-14 rounded-full ${tint} flex items-center justify-center mx-auto mb-5`}>
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

export default CryptomusInlinePayment;
