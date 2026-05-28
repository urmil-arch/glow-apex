import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name}</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your platform from here.</p>
      </div>

      <div className="flex items-center gap-4 p-6 rounded-2xl bg-teal-50 border border-teal-100">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100">
          <ShieldCheck className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <p className="text-gray-900 font-semibold">Admin Panel Active</p>
          <p className="text-gray-500 text-sm">
            Use the sidebar to manage users, services, and settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
