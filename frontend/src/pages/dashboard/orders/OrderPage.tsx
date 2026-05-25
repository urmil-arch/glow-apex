import { CheckCircle, Clock, CreditCard, Filter, Package, Search, XCircle } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type OrderStatus = "completed" | "processing" | "cancelled";

interface Order {
  id: string;
  service: string;
  quantity: number;
  date: string;
  status: OrderStatus;
  price: number;
  link: string;
}

interface ServiceLink {
  label: string;
  to: string;
  sub: string;
}

const SERVICE_LINKS: ServiceLink[] = [
  { label: "YouTube Views", sub: "Boost video reach", to: "/service/5209" },
  { label: "YouTube Likes", sub: "Increase engagement", to: "/service/2342" },
  { label: "Subscribers", sub: "Grow your channel", to: "/service/376" },
  { label: "YouTube Shorts", sub: "Go viral fast", to: "/service/5648" },
];

const SERVICE_ROUTES: Record<string, string> = {
  "YouTube Likes": "/service/2342",
  "YouTube Views": "/service/5209",
  "YouTube Subscribers": "/service/376",
  "YouTube Shorts": "/service/5648",
  "YouTube Comments": "/",
};

const MOCK_ORDERS: Order[] = [
  { id: "ORD-12345", service: "YouTube Likes", quantity: 500, date: "Apr 10, 2025", status: "completed", price: 9.99, link: "https://youtube.com/watch?v=12345" },
  { id: "ORD-12346", service: "YouTube Subscribers", quantity: 100, date: "Apr 5, 2025", status: "processing", price: 14.99, link: "https://youtube.com/c/channelname" },
  { id: "ORD-12347", service: "YouTube Views", quantity: 1000, date: "Apr 1, 2025", status: "completed", price: 12.99, link: "https://youtube.com/watch?v=67890" },
  { id: "ORD-12348", service: "YouTube Comments", quantity: 50, date: "Mar 25, 2025", status: "cancelled", price: 8.99, link: "https://youtube.com/watch?v=54321" },
  { id: "ORD-12349", service: "YouTube Likes", quantity: 250, date: "Mar 20, 2025", status: "completed", price: 5.49, link: "https://youtube.com/watch?v=24680" },
];

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case "completed":
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle className="w-3 h-3" />Completed
        </span>
      );
    case "processing":
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
          <Clock className="w-3 h-3" />Processing
        </span>
      );
    case "cancelled":
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
          <XCircle className="w-3 h-3" />Cancelled
        </span>
      );
  }
};

const OrderPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const totalSpent = MOCK_ORDERS.reduce((sum, o) => sum + o.price, 0);

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.link.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
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

      {/* Service quick-buy cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SERVICE_LINKS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="bg-white border border-gray-100 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <p className="text-xs text-gray-400 mb-1">{s.sub}</p>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
              {s.label}
            </p>
            <p className="text-xs text-teal-500 mt-1 font-medium">Buy now →</p>
          </Link>
        ))}
      </div>

      {/* Stat summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-center gap-3">
          <div className="bg-teal-50 rounded-lg p-2.5 flex-shrink-0">
            <Package className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800">{MOCK_ORDERS.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-center gap-3">
          <div className="bg-emerald-50 rounded-lg p-2.5 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-gray-800">${totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Order History</h3>
        </div>

        {/* Search + filter */}
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
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Link</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{order.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-800">{order.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-teal-600 hidden md:table-cell">
                      <a href={order.link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block max-w-[180px]">
                        {order.link}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                      <span className="block">{order.service}</span>
                      <span className="text-gray-400">Qty: {order.quantity}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 hidden sm:table-cell">
                      ${order.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs hidden sm:table-cell">
                      <div className="flex items-center gap-3">
                        <Link
                          to={SERVICE_ROUTES[order.service] ?? "/"}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Reorder
                        </Link>
                        {order.status === "processing" && (
                          <button className="font-medium text-red-500 hover:text-red-600">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No orders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
