import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) {

            navigate("/login");
            return;
        }

        try {

            const decoded = jwtDecode(token);


            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                console.warn("El token ha expirado");
                handleLogout();
                return;
            }

            setUser(decoded);
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            handleLogout();
        }
    }, [navigate]);

    const handleLogout = () => {

        localStorage.removeItem("token");
        navigate("/login");
    };

    if (!user) return <p>Cargando perfil...</p>;

    return (
        <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
            <h1>Bienvenido a tu Dashboard</h1>
            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px", maxWidth: "400px" }}>
                <h3>Tu Perfil</h3>
                <p><strong>Usuario (sub):</strong> {user.sub}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <button
                    onClick={handleLogout}
                    style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}
