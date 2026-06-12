import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const ApiUrl = import.meta.env.VITE_API_URL
    useEffect(() => {
        fetch(${ApiUrl}/api/auth/me, {
            credentials: "include"
        })
        .then(res => {
            if (res.ok) setIsAuthenticated(true);
            else setIsAuthenticated(false);
        })
        .catch(() => setIsAuthenticated(false));
    }, []);

    if (isAuthenticated === null) return <div>Comprobando acceso...</div>;

    if (isAuthenticated === false) return <Navigate to="/login" replace />;

    return children;
}