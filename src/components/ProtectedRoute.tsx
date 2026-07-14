import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/user.types';
import { ROLE_GROUPS } from '../utils/roleGroups';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRoles?: UserRole[];
    allowedGroup?: keyof typeof ROLE_GROUPS;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, allowedGroup }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasAccess = () => {
        if (!allowedRoles && !allowedGroup) return true;
        if (!user) return false;

        const userRole = (user.role as string)?.toLowerCase();
        const userGroup = (user as any).group?.toUpperCase();

        if (allowedRoles && userRole && allowedRoles.includes(userRole as any)) return true;
        
        if (allowedGroup) {
            if (userGroup === allowedGroup.toUpperCase()) return true;
            if (userRole && ROLE_GROUPS[allowedGroup]?.includes(userRole as any)) return true;
        }

        return false;
    };

    if (!hasAccess()) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </div>
                <h2 className="text-2xl font-bold text-main">Access Denied</h2>
                <p className="text-muted mt-2 max-w-md">
                    You do not have the necessary permissions to view this page.
                    Please contact your administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    return <>{children || <Outlet />}</>;
};

export default ProtectedRoute;
