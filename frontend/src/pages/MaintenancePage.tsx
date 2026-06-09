import { Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

const MaintenancePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/40 flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Wrench className="h-10 w-10 text-amber-500" />
        </div>
      </div>

      <img
        src="/web-app-manifest-192x192-removebg-preview.png"
        alt="BuyRealViews"
        className="h-10 w-auto mx-auto mb-5 opacity-80"
      />

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        We're Under Maintenance
      </h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8">
        We're currently performing scheduled maintenance to improve your experience.
        Please check back shortly — we'll be back online very soon.
      </p>

      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Maintenance in progress
      </div>

      <Link
        to="/sign-in"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
      >
        Back to Login
      </Link>
    </div>
  </div>
);

export default MaintenancePage;
