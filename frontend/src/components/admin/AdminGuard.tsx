import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminGuard = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminGuard;
