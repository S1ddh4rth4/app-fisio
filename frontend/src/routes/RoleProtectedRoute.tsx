import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
    allowedRoles: string[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const hasPermission = user?.roles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
        // Si no tiene el rol adecuado, lo regresa al inicio
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};