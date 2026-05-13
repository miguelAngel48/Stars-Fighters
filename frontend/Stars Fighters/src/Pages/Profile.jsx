import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Profile.css";

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [copySuccess, setCopySuccess] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch("http://localhost:8080/api/auth/profile", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            }
        };

        fetchProfile();
    }, [navigate]);

    const copyToClipboard = () => {
        console.log("Intentando copiar:", userData?.friendCode);
        if (userData?.friendCode) {
            navigator.clipboard.writeText(userData.friendCode);
            setCopySuccess("¡Copiado!");
            setTimeout(() => setCopySuccess(""), 2000);
        }
    };

    if (!userData) return <div className="loading">Cargando perfil...</div>;

    return (
        <div className="profile-page-container">
            {/* Cabecera con botón volver */}
            <header className="profile-header">
                <button className="back-btn" onClick={() => navigate("/dashboard")}>
                    ← Volver al juego
                </button>
                <h1>Mi Perfil</h1>
            </header>

            <div className="profile-content">

                <div className="profile-main-card">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`}
                        alt="Avatar"
                        className="large-avatar"
                    />
                    <h2>{userData.username}</h2>
                    <span className="badge-level">Nivel {userData.level}</span>
                </div>

                <div className="friend-code-section">
                    <h3>Tu Código de Amigo</h3>
                    <div className="code-display" onClick={copyToClipboard}>
                        <span className="code-text">{userData.friendCode}</span>
                        <button className="copy-btn">📋</button>
                    </div>
                    {copySuccess && <span className="copy-msg">{copySuccess}</span>}
                    <p className="helper-text">Compártelo con tus amigos para que te añadan en Stars Fighters.</p>
                </div>

                <div className="account-details">
                    <div className="detail-item">
                        <label>Email</label>
                        <p>{userData.email}</p>
                    </div>
                    <div className="detail-item">
                        <label>Estado de Cuenta</label>
                        <p className="status-verified">✓ Verificada</p>
                    </div>
                </div>

                <button className="btn-edit-profile" disabled>
                    Editar Perfil (Próximamente)
                </button>
            </div>
        </div>
    );
}