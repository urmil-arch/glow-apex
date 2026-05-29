import { LogOut, ShieldOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SUPPORT_EMAIL = "support@buyrealviews.com";

const SuspendedPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Your account has been suspended by an administrator.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          If you believe this is a mistake, email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-600 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default SuspendedPage;
