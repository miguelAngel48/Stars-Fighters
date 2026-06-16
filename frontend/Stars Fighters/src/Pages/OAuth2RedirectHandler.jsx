import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function OAuth2RedirectHandler() {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('token', token);
            window.location.href = '/dashboard';
        } else {
            window.location.href = '/login';
        }
    }, [location]);

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2 style={{ color: "var(--color-primary)" }}>Procesando inicio de sesión con Google...</h2>
            <p>Preparando la arena de combate...</p>
        </div>
    );
}