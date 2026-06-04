import {
  AlertCircle, CheckCircle, Clock, CreditCard, ExternalLink,
  Filter, Loader, Package, RefreshCw, Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrderStore } from "@/store/useOrderStore";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { UserOrder } from "@/types";
import RaiseTicketModal from "@/components/common/RaiseTicketModal";

const toUtc = (d: string) => d && !d.endsWith('Z') && !d.includes('+') ? `${d}Z` : d;


type StatusKey = "payment_pending" | "success" | "in_progress" | "error";

function mapOrderStatus(raw: string): { label: string; key: StatusKey } {
  const s = (raw ?? "").toLowerCase().replace(/_/g, " ");
  if (s === "pending payment") return { label: "Payment Pending", key: "payment_pending" };
  if (s === "pending")         return { label: "Success",         key: "success" };
  if (s === "completed")       return { label: "Success",         key: "success" };
  if (s === "in progress" || s === "inprogress" || s === "processing")
                               return { label: "In Progress",     key: "in_progress" };
  if (s === "partial")         return { label: "In Progress",     key: "in_progress" };
  return                              { label: "In Progress",     key: "in_progress" };
}

function getStatusBadge(rawStatus: string) {
  const { label, key } = mapOrderStatus(rawStatus);
  if (key === "success") return (
    <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
      <CheckCircle className="w-3 h-3" />{label}
    </span>
  );
  if (key === "in_progress") return (
    <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
      <RefreshCw className="w-3 h-3" />{label}
    </span>
  );
  if (key === "payment_pending") return (
    <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
      <Clock className="w-3 h-3" />{label}
    </span>
  );
  return (
    <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
      <AlertCircle className="w-3 h-3" />{label}
    </span>
  );
}

interface StatusModalProps {
  order: UserOrder;
  onClose: () => void;
  onRefresh: (id: string) => Promise<void>;
  onRefill: () => void;
}

function StatusModal({ order, onClose, onRefresh, onRefill }: StatusModalProps) {
  const [loading, setLoading] = useState<"refresh" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<UserOrder>(order);

  async function handleRefresh() {
    setLoading("refresh");
    setError(null);
    try {
      const res = await api.get<UserOrder>(`${API_ENDPOINTS.ORDERS}/${localOrder.id}`);
      setLocalOrder(res.data);
      await onRefresh(localOrder.id);
    } catch {
      setError("Unable to refresh status at the moment. Please try again later.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    setLoading("cancel");
    setError(null);
    try {
      await api.post(`${API_ENDPOINTS.ORDERS}/${localOrder.id}/cancel`);
      setLocalOrder({ ...localOrder, status: "Cancelled" });
      await onRefresh(localOrder.id);
    } catch {
      setError("Unable to cancel at the moment. Please try again later.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Order Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-xs text-gray-500">#{localOrder.id.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">{localOrder.category_name || localOrder.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity</span>
            <span className="text-gray-700">{localOrder.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span>{getStatusBadge(localOrder.status)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Start Count</span>
            <span className="text-gray-700">{localOrder.start_count || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Remains</span>
            <span className="text-gray-700">{localOrder.remains || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Charge</span>
            <span className="text-gray-700">${localOrder.charge.toFixed(4)} {localOrder.currency}</span>
          </div>
          {localOrder.payment_method && localOrder.payment_method !== "direct" && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Via</span>
                <span className="capitalize font-medium text-gray-800">{localOrder.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  localOrder.payment_status === "paid"    ? "bg-green-100 text-green-700"   :
                  localOrder.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  localOrder.payment_status === "failed"  ? "bg-red-100 text-red-600"       :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {localOrder.payment_status || "—"}
                </span>
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={loading !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {loading === "refresh" ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          <button
            onClick={onRefill}
            disabled={loading !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors"
          >
            Order Again
          </button>
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {loading === "cancel" && <Loader className="w-3.5 h-3.5 animate-spin" />}
            Cancel this Order
          </button>
        </div>
      </div>
    </div>
  );
}

const OrderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setCategoryOrder } = useOrderStore();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [ticketOrder, setTicketOrder] = useState<UserOrder | null>(null);

  async function fetchOrders() {
    setLoadingOrders(true);
    setFetchError(null);
    try {
      const res = await api.get<{ orders: UserOrder[] }>(API_ENDPOINTS.ORDERS);
      setOrders(res.data.orders);
    } catch {
      setFetchError("Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function refreshOrder(id: string) {
    try {
      const res = await api.get<UserOrder>(`${API_ENDPOINTS.ORDERS}/${id}`);
      setOrders((prev) => prev.map((o) => (o.id === id ? res.data : o)));
    } catch {
      // silently ignore — UI already shows updated state from modal
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + o.charge, 0);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.link.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || mapOrderStatus(o.status).key === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      {selectedOrder && (
        <StatusModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={refreshOrder}
          onRefill={() => {
            setCategoryOrder({
              categoryName: selectedOrder.category_name || selectedOrder.service_name,
              quantity: selectedOrder.quantity,
              link: selectedOrder.link,
            });
            setSelectedOrder(null);
            navigate("/checkout");
          }}
        />
      )}
      {ticketOrder && (
        <RaiseTicketModal
          initialType="order_related"
          initialOrderId={ticketOrder.id}
          onClose={() => setTicketOrder(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl p-5 md:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">
              Welcome back, {user?.full_name ?? "there"}!
            </h2>
            <p className="text-teal-100 text-sm mt-0.5">
              Manage your orders and keep growing your channel.
            </p>
          </div>
          <Link
            to="/"
            className="self-start sm:self-center bg-white text-emerald-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-50 transition-colors text-sm whitespace-nowrap"
          >
            + New Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-center gap-3">
          <div className="bg-teal-50 rounded-lg p-2.5 flex-shrink-0">
            <Package className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-center gap-3">
          <div className="bg-emerald-50 rounded-lg p-2.5 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-gray-800">${totalSpent.toFixed(4)}</p>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Order History</h3>
        </div>

        <div className="px-4 md:px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              className="appearance-none text-sm border border-gray-200 rounded-lg px-4 py-2 pr-8 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="success">Success</option>
              <option value="in_progress">In Progress</option>
            </select>
            <Filter className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="w-7 h-7 animate-spin text-teal-500" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-12 text-sm text-red-500">{fetchError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Charge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500 hidden sm:table-cell">
                        #{order.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(toUtc(order.created_at)).toLocaleString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-teal-600 hidden md:table-cell">
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline max-w-[160px] truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{order.link}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                        <span className="block font-medium">{order.category_name || order.service_name}</span>
                        <span className="text-gray-400">Qty: {order.quantity.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 hidden sm:table-cell">
                        ${order.charge.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="font-medium text-teal-600 hover:text-teal-700"
                          >
                            Details
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => setTicketOrder(order)}
                            className="font-medium text-orange-500 hover:text-orange-600"
                          >
                            Raise Ticket
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                      {orders.length === 0 ? (
                        <span>
                          No orders yet.{" "}
                          <Link to="/services" className="text-teal-500 hover:underline">
                            Place your first order
                          </Link>
                        </span>
                      ) : (
                        "No orders match your search."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
