'use client'
import { BarChart2, Search } from "lucide-react";
import React, { useState } from "react";

// Service analytics interface
interface ServiceAnalytics {
  service: string;
  growth: number;
  total: number;
  status: "increasing" | "decreasing" | "stable";
}

const AnalyticsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock analytics data
  const analytics: ServiceAnalytics[] = [
    {
      service: "YouTube Likes",
      growth: 15,
      total: 2250,
      status: "increasing",
    },
    {
      service: "YouTube Subscribers",
      growth: 5,
      total: 350,
      status: "stable",
    },
    {
      service: "YouTube Views",
      growth: 20,
      total: 5000,
      status: "increasing",
    },
    {
      service: "YouTube Comments",
      growth: -10,
      total: 125,
      status: "decreasing",
    },
  ];

  // Helper function to get growth indicator
  const getGrowthIndicator = (
    status: "increasing" | "decreasing" | "stable",
    growth: number
  ) => {
    switch (status) {
      case "increasing":
        return (
          <span className="inline-flex items-center text-green-600">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            {growth}%
          </span>
        );
      case "decreasing":
        return (
          <span className="inline-flex items-center text-red-600">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              ></path>
            </svg>
            {Math.abs(growth)}%
          </span>
        );
      case "stable":
        return (
          <span className="inline-flex items-center text-gray-600">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            {growth}%
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search analytics...`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                Service Performance
              </h3>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden md:border md:border-gray-200 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-4"
                          >
                            Service
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-4"
                          >
                            Growth
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-4"
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.map((item) => (
                          <tr key={item.service} className="hover:bg-gray-50">
                            <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 md:px-4">
                              {item.service}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm md:px-4">
                              {getGrowthIndicator(item.status, item.growth)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs md:text-sm text-gray-800 md:px-4">
                              {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                Monthly Spending
              </h3>
              <div className="h-48 md:h-64 flex items-center justify-center">
                <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart2 className="h-8 w-8 md:h-12 md:w-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm md:text-base">
                      Chart visualization would appear here
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs md:text-sm space-y-2 md:space-y-0">
                <div className="text-gray-500">
                  This month:{" "}
                  <span className="font-medium text-gray-900">$24.99</span>
                </div>
                <div className="text-gray-500">
                  Last month:{" "}
                  <span className="font-medium text-gray-900">$19.49</span>
                </div>
                <div className="text-emerald-600 font-medium">+28.2%</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                Order Completion Rate
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Completed
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    85%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">52 orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Processing
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    12%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">7 orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Cancelled
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-red-600">
                    3%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
