import { useAuth } from "@/context/AuthContext";
import { BarChart2, Bell, CreditCard, LogOut, Menu, Package, User, X, Home } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import React, { useEffect, useState } from "react";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">You need to be logged in to view this page.</p>
          <Link to="/sign-in" className="mt-4 inline-block bg-emerald-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={toggleSidebar}></div>
      )}

      <aside className={`bg-white shadow-lg fixed h-screen z-30 transition-all duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isMobile ? "w-64" : isSidebarOpen ? "w-64" : "w-20 md:w-20"}`}>
        <div className={`p-4 flex items-center border-b ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
          {isSidebarOpen && (
            <Link to="/" className="text-xl font-bold hover:text-emerald-600 transition-colors truncate">
              GLOW APEX
            </Link>
          )}
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            {isMobile && isSidebarOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>

        <nav className="mt-6 px-2">
          <div className={`mb-8 flex items-center ${isSidebarOpen ? "px-4" : "justify-center"}`}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <div className="bg-emerald-100 w-full h-full flex items-center justify-center">
                <span className="text-emerald-700 font-medium text-lg">{user.full_name.charAt(0)}</span>
              </div>
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="font-medium text-gray-800 truncate">{user.full_name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>

          <ul className="space-y-2">
            <li>
              <Link to="/" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <Home className="w-6 h-6" />
                {isSidebarOpen && <span className="ml-3">Main Site</span>}
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="flex items-center p-3 bg-emerald-50 text-emerald-600 rounded-lg transition-colors" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                {isSidebarOpen && <span className="ml-3">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link to="/service/2342" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                {isSidebarOpen && <span className="ml-3">Buy Likes</span>}
              </Link>
            </li>
            <li>
              <Link to="/service/376" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                {isSidebarOpen && <span className="ml-3">Buy Subscribers</span>}
              </Link>
            </li>
            <li>
              <Link to="/service/5648" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => isMobile && setIsSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                {isSidebarOpen && <span className="ml-3">Buy Views</span>}
              </Link>
            </li>
            <li>
              <Link to="/dashboard/profile" className={`flex items-center p-3 rounded-lg transition-colors ${pathname.includes("profile") ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"}`} onClick={() => isMobile && setIsSidebarOpen(false)}>
                <User className="w-6 h-6" />
                {isSidebarOpen && <span className="ml-3">Profile</span>}
              </Link>
            </li>
            <li>
              <button onClick={logout} className="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-6 h-6" />
                {isSidebarOpen && <span className="ml-3">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-20 ${isSidebarOpen && !isMobile ? "md:ml-64" : ""}`}>
        <header className="bg-white shadow-sm py-4 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            <button className="mr-4 p-2 rounded-lg md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              {pathname.includes("profile") ? "Profile Settings" : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="h-5 w-5 md:h-6 md:w-6" />
              <span className="absolute top-0 right-0 h-3 w-3 md:h-4 md:w-4 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button onClick={() => navigate("/dashboard/profile")} className={`relative p-2 rounded-full transition-colors ${pathname.includes("profile") ? "bg-emerald-100 text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              <User className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-grow">
          {pathname.includes("profile") ? (
            <Outlet />
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold mb-2">Welcome back, {user.full_name}!</h2>
                    <p className="text-gray-600 text-sm md:text-base">Here's a summary of your account activity and orders.</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <Link to="/" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                      Place New Order
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Orders</p>
                      <p className="text-xl md:text-2xl font-bold mt-1">2</p>
                    </div>
                    <div className="bg-indigo-100 rounded-full p-3 text-indigo-600"><Package className="h-5 w-5 md:h-6 md:w-6" /></div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-green-500 flex items-center">+12%</span>
                    <span className="text-gray-500 ml-2">From last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Spent</p>
                      <p className="text-xl md:text-2xl font-bold mt-1">$52.45</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3 text-green-600"><CreditCard className="h-5 w-5 md:h-6 md:w-6" /></div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-green-500 flex items-center">+8%</span>
                    <span className="text-gray-500 ml-2">From last month</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6 sm:col-span-2 lg:col-span-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                      <p className="text-xl md:text-2xl font-bold mt-1">+15%</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3 text-purple-600"><BarChart2 className="h-5 w-5 md:h-6 md:w-6" /></div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-green-500 flex items-center">+23%</span>
                    <span className="text-gray-500 ml-2">From last month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="md:flex hidden flex-wrap overflow-x-auto border-b">
                  <button className={`px-4 py-3 md:px-6 md:py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${pathname.includes("orders") ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => navigate("/dashboard/orders")}>
                    <Package className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1 md:mr-2" />Orders
                  </button>
                  <button className={`px-4 py-3 md:px-6 md:py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${pathname.includes("payments") ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => navigate("/dashboard/payments")}>
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1 md:mr-2" />Payments
                  </button>
                  <button className={`px-4 py-3 md:px-6 md:py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${pathname.includes("analytics") ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => navigate("/dashboard/analytics")}>
                    <BarChart2 className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1 md:mr-2" />Analytics
                  </button>
                </div>
                <Outlet />
              </div>
            </>
          )}
        </main>

        <footer className="md:hidden bg-white border-t py-3 px-4 mt-auto sticky bottom-0">
          <div className="flex justify-around">
            <button onClick={() => navigate("/dashboard/orders")} className={`flex flex-col items-center ${pathname.includes("orders") ? "text-emerald-600" : "text-gray-500"}`}>
              <Package className="h-5 w-5 mb-1" />
              <span className="text-xs">Orders</span>
            </button>
            <button onClick={() => navigate("/dashboard/payments")} className={`flex flex-col items-center ${pathname.includes("payments") ? "text-emerald-600" : "text-gray-500"}`}>
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Payments</span>
            </button>
            <button onClick={() => navigate("/dashboard/analytics")} className={`flex flex-col items-center ${pathname.includes("analytics") ? "text-emerald-600" : "text-gray-500"}`}>
              <BarChart2 className="h-5 w-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
