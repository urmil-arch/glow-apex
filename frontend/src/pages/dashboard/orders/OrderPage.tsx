import { CheckCircle, Clock, Filter, Search, XCircle } from "lucide-react";
import React, { useState } from "react";

type OrderStatus = "completed" | "processing" | "cancelled";

// Order interface
interface Order {
  id: string;
  service: string;
  quantity: number;
  date: string;
  status: OrderStatus;
  price: number;
  link: string;
}

const OrderPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Mock order data
  const orders: Order[] = [
    {
      id: "ORD-12345",
      service: "YouTube Likes",
      quantity: 500,
      date: "Apr 10, 2025",
      status: "completed",
      price: 9.99,
      link: "https://youtube.com/watch?v=12345",
    },
    {
      id: "ORD-12346",
      service: "YouTube Subscribers",
      quantity: 100,
      date: "Apr 5, 2025",
      status: "processing",
      price: 14.99,
      link: "https://youtube.com/c/channelname",
    },
    {
      id: "ORD-12347",
      service: "YouTube Views",
      quantity: 1000,
      date: "Apr 1, 2025",
      status: "completed",
      price: 12.99,
      link: "https://youtube.com/watch?v=67890",
    },
    {
      id: "ORD-12348",
      service: "YouTube Comments",
      quantity: 50,
      date: "Mar 25, 2025",
      status: "cancelled",
      price: 8.99,
      link: "https://youtube.com/watch?v=54321",
    },
    {
      id: "ORD-12349",
      service: "YouTube Likes",
      quantity: 250,
      date: "Mar 20, 2025",
      status: "completed",
      price: 5.49,
      link: "https://youtube.com/watch?v=24680",
    },
  ];

  // Filter orders based on search term and filter status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.link.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Helper function to display status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search and filters */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ...`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-auto">
            <select
              className="appearance-none border border-gray-300 rounded-lg px-4 py-2 pr-8 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Filter className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6"
                      >
                        Order ID
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 hidden md:table-cell"
                      >
                        Link
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6"
                      >
                        Service
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 hidden sm:table-cell"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 hidden sm:table-cell"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 md:px-6">
                            {order.date}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 md:px-6">
                            {order.id}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 hidden md:table-cell md:px-6">
                            <a
                              href={order.link}
                              className="truncate block max-w-xs"
                            >
                              {order.link}
                            </a>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 md:px-6">
                            <div className="flex flex-col">
                              <span>{order.service}</span>
                              <span className="text-xs text-gray-500">
                                Qty: {order.quantity}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 hidden sm:table-cell md:px-6">
                            ${order.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap md:px-6">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden sm:table-cell md:px-6">
                            <div className="flex space-x-2">
                              <a
                                href={order.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-orange-500"
                              >
                                Reorder
                              </a>
                              {order.status === "processing" && (
                                <button className="text-red-600 hover:text-red-800 font-medium">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-4 text-center text-gray-500 md:px-6"
                        >
                          No orders matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile-only order action buttons */}
          <div className="mt-4 sm:hidden">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Quick Actions:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-emerald-100 text-emerald-700 py-2 px-4 rounded-md text-sm font-medium">
                Reorder
              </button>
              <button className="bg-red-100 text-red-700 py-2 px-4 rounded-md text-sm font-medium">
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderPage;
