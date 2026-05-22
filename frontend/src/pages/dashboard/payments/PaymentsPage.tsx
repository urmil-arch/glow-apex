'use client'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
} from "lucide-react";
import React, { useState } from "react";

// Payment interface
interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "success" | "pending" | "failed";
  invoiceUrl: string;
}

const PaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock payment data
  const payments: Payment[] = [
    {
      id: "PAY-98765",
      date: "Apr 10, 2025",
      amount: 9.99,
      method: "Credit Card",
      status: "success",
      invoiceUrl: "#invoice-123",
    },
    {
      id: "PAY-98766",
      date: "Apr 5, 2025",
      amount: 14.99,
      method: "PayPal",
      status: "success",
      invoiceUrl: "#invoice-124",
    },
    {
      id: "PAY-98767",
      date: "Apr 1, 2025",
      amount: 12.99,
      method: "Credit Card",
      status: "success",
      invoiceUrl: "#invoice-125",
    },
    {
      id: "PAY-98768",
      date: "Mar 25, 2025",
      amount: 8.99,
      method: "Crypto",
      status: "failed",
      invoiceUrl: "#invoice-126",
    },
    {
      id: "PAY-98769",
      date: "Mar 20, 2025",
      amount: 5.49,
      method: "Bank Transfer",
      status: "pending",
      invoiceUrl: "#invoice-127",
    },
  ];

  // Filter payments based on search term
  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to display payment status badge
  const getPaymentStatusBadge = (status: "success" | "pending" | "failed") => {
    switch (status) {
      case "success":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
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
              placeholder={`Search payments`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                        Transaction ID
                      </th>
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
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 hidden sm:table-cell"
                      >
                        Method
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
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 md:px-6">
                            {payment.id}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 md:px-6">
                            {payment.date}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 md:px-6">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 hidden sm:table-cell md:px-6">
                            {payment.method}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap md:px-6">
                            {getPaymentStatusBadge(payment.status)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden sm:table-cell md:px-6">
                            <a
                              href={payment.invoiceUrl}
                              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-center text-gray-500 md:px-6"
                        >
                          No payment records matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile-only invoice download button */}
          <div className="mt-4 sm:hidden">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Download Invoice:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="bg-blue-100 text-blue-700 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center">
                <Download className="h-4 w-4 mr-1" />
                Get Latest Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentsPage;
