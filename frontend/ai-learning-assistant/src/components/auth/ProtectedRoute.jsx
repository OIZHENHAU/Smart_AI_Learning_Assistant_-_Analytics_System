import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";

const ProtectedRoute = () => {
    const isAuthenticate = true;
    const loading = false;

    if (loading) {
        return <div>Loading...</div>
    }

    return isAuthenticate ? (
        <AppLayout>
            <Outlet/>
        </AppLayout>
    ) : (
        <Navigate to="/login" replace/>
    )

}

export default ProtectedRoute