import { useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle, Clock, CreditCard,
  ExternalLink, Loader2, RefreshCw, Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";
import RaiseTicketModal from "@/components/common/RaiseTicketModal";

interface UserPayment {
  id: string;
  display_id: number;
  order_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  service_name: string;
  category_name: string;
  quantity: number;
  memo: string;
  order_status: string;
  order_link: string;
  order_provider_id: string;
  created_at: string;
}

type StatusKey = "payment_pending" | "success" | "in_progress" | "error";

function mapOrderStatus(raw: string): { label: string; key: StatusKey } {
  const s = (raw ?? "").toLowerCase().replace(/_/g, " ");
  if (s === "pending payment") return { label: "Payment Pending", key: "payment_pending" };
  if (s === "pending")         return { label: "Success",         key: "success" };
  if (s === "completed")       return { label: "Success",         key: "success" };
  if (s === "in progress" || s === "inprogress" || s === "processing")
                               return { label: "In Progress",     key: "in_progress" };
  if (s === "partial")         return { label: "In Progress",     key: "in_progress" };
  return                              { label: "Error",           key: "error" };
}

const paymentStatusBadge = (s: string) => {
  const l = s.toLowerCase();
  if (l === "paid")    return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />Paid</span>;
  if (l === "pending") return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />Pending</span>;
  if (l === "failed")  return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600"><AlertCircle className="w-3 h-3" />Failed</span>;
  return <span className="text-xs text-gray-400">{s || "—"}</span>;
};

const orderStatusBadge = (raw: string) => {
  if (!raw) return <span className="text-xs text-gray-400">—</span>;
  const { label, key } = mapOrderStatus(raw);
  const cls =
    key === "success"         ? "bg-green-100 text-green-700"   :
    key === "in_progress"     ? "bg-blue-100 text-blue-700"     :
    key === "payment_pending" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-600";
  const Icon =
    key === "success"         ? CheckCircle  :
    key === "in_progress"     ? RefreshCw    :
    key === "payment_pending" ? Clock        :
                                AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  );
};

const methodBadge = (m: string) => {
  const l = m.toLowerCase();
  const cls =
    l === "stripe"   ? "bg-indigo-100 text-indigo-700" :
    l === "razorpay" ? "bg-blue-100 text-blue-700"     :
    l === "manual"   ? "bg-teal-100 text-teal-700"     :
    "bg-gray-100 text-gray-600";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cls}`}>{m || "—"}</span>;
};

const toUtc = (d: string) => d && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;

const fmtDate = (d: string) =>
  new Date(toUtc(d)).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const PaymentsPage = () => {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ticketPayment, setTicketPayment] = useState<UserPayment | null>(null);

  useEffect(() => {
    api.get<{ payments: UserPayment[]; total: number }>(
      API_ENDPOINTS.USER_PAYMENTS,
      { params: { page_size: 100 } },
    )
      .then(res => setPayments(res.data.payments ?? []))
      .catch(() => setError("Failed to load payment history."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return (
      p.service_name.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q) ||
      p.order_link.toLowerCase().includes(q) ||
      p.order_id.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-teal-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {ticketPayment && (
        <RaiseTicketModal
          initialType="payment_related"
          initialOrderId={ticketPayment.order_id}
          onClose={() => setTicketPayment(null)}
          onSuccess={() => {}}
        />
      )}

      <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search payments…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {error ? (
        <p className="text-center py-16 text-red-500 text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-xl border border-gray-200">
          <CreditCard className="w-10 h-10 text-gray-300" />
          <p className="text-sm text-gray-400">{search ? "No payments match your search." : "No payment records yet."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Via</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Order Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <>
                    <tr
                      key={p.id}
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{p.order_id.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-800 max-w-[140px] truncate">{p.category_name || p.service_name || p.memo || "—"}</p>
                        <p className="text-xs text-gray-400">{p.quantity > 0 ? `${p.quantity.toLocaleString()} units` : ""}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${p.amount.toFixed(4)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{methodBadge(p.method)}</td>
                      <td className="px-4 py-3">{paymentStatusBadge(p.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{orderStatusBadge(p.order_status)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setTicketPayment(p)}
                          className="text-xs font-medium text-orange-500 hover:text-orange-600"
                        >
                          Raise Ticket
                        </button>
                      </td>
                    </tr>

                    {expanded === p.id && (
                      <tr key={`${p.id}-detail`} className="bg-teal-50 border-b border-teal-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-gray-400 mb-0.5">Order Status</p>
                              {orderStatusBadge(p.order_status || "—")}
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">YouTube Link</p>
                              {p.order_link ? (
                                <a
                                  href={p.order_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-600 hover:underline inline-flex items-center gap-1 max-w-[240px] truncate"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {p.order_link} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : "—"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
