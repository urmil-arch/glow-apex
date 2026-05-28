import { CheckCircle, Clock, CreditCard, ExternalLink, Filter, Loader, Package, RefreshCw, Search, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { UserOrder } from "@/types";

interface StatusModalProps {
  order: UserOrder;
  onClose: () => void;
  onRefresh: (id: string) => Promise<void>;
}

function StatusModal({ order, onClose, onRefresh }: StatusModalProps) {
  const [loading, setLoading] = useState<"refresh" | "refill" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refillId, setRefillId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<UserOrder>(order);

  function extractDetail(err: unknown, fallback: string): string {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    return typeof detail === "string" ? detail : fallback;
  }

  async function handleRefresh() {
    setLoading("refresh");
    setError(null);
    try {
      const res = await api.get<UserOrder>(`${API_ENDPOINTS.ORDERS}/${localOrder.id}`);
      setLocalOrder(res.data);
      await onRefresh(localOrder.id);
    } catch (err: unknown) {
      setError(extractDetail(err, "Failed to refresh status."));
    } finally {
      setLoading(null);
    }
  }

  async function handleRefill() {
    setLoading("refill");
    setError(null);
    try {
      const res = await api.post<{ refill_id: string }>(`${API_ENDPOINTS.ORDERS}/${localOrder.id}/refill`);
      setRefillId(res.data.refill_id);
    } catch (err: unknown) {
      setError(extractDetail(err, "Refill request failed."));
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
    } catch (err: unknown) {
      setError(extractDetail(err, "Cancel request failed."));
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
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">{localOrder.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Provider Order ID</span>
            <span className="font-medium text-gray-800">{localOrder.provider_order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium text-gray-800">{localOrder.status}</span>
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
        </div>

        {refillId && (
          <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
            Refill submitted — ID: {refillId}
          </p>
        )}

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
            onClick={handleRefill}
            disabled={loading !== null || localOrder.status === "Cancelled"}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors"
          >
            {loading === "refill" ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
            Refill
          </button>
          <button
            onClick={handleCancel}
            disabled={loading !== null || localOrder.status === "Cancelled"}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {loading === "cancel" ? <Loader className="w-3.5 h-3.5 animate-spin" /> : null}
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") {
    return (
      <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
        <CheckCircle className="w-3 h-3" />Completed
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
        <XCircle className="w-3 h-3" />Cancelled
      </span>
    );
  }
  return (
    <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
      <Clock className="w-3 h-3" />{status || "Pending"}
    </span>
  );
}

const OrderPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);

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
      o.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.provider_order_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || o.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      {selectedOrder && (
        <StatusModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={refreshOrder}
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
            to="/services"
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
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
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
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
                        <span className="block font-medium">{order.service_name}</span>
                        <span className="text-gray-400">Qty: {order.quantity.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 hidden sm:table-cell">
                        ${order.charge.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Status
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
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
