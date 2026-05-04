import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuth2RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {

            localStorage.setItem('token', token);

            navigate('/dashboard');
        } else {

            navigate('/login');
        }
    }, [location, navigate]);

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Procesando inicio de sesión con Google...</h2>
        </div>
    );
}