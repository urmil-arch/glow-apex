import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { firstAllowedAdminPath } from '@/config/permissions';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactElement;
}

/**
 * Gate a single admin route by a page permission. If the user lacks it, they are
 * redirected to the first admin page they can access (or home if they have none).
 */
const RequirePermission = ({ permission, children }: RequirePermissionProps) => {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  if (!permissions.includes(permission)) {
    return <Navigate to={firstAllowedAdminPath(permissions)} replace />;
  }
  return children;
};

export default RequirePermission;
