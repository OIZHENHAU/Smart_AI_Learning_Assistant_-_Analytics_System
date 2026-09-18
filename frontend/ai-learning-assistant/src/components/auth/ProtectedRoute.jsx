import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = () => {
    const {isAuthenticated, loading, user} = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }

    //Only admins may access the admin-only routes; everyone else gets sent back to their dashboard.
    const isAdminRoute = location.pathname.startsWith('/admin');
    if (user?.role !== 'admin' && isAdminRoute) {
        return <Navigate to="/dashboard" replace/>
    }

    return (
        <AppLayout>
            <Outlet/>
        </AppLayout>
    )
}

export default ProtectedRoute
