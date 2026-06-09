import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  // Any staff member (one or more admin-page permissions) may enter the panel;
  // per-page access is enforced by RequirePermission on each route.
  if ((user?.permissions ?? []).length === 0) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminGuard;
