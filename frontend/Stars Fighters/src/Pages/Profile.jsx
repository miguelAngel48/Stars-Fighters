import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import Navbar from "../Components/Navbar";
import "../Styles/Profile.css";

export default function Profile() {
    const { user, refreshUser } = useUser();
    const [copySuccess, setCopySuccess] = useState("");
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/login");
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const copyToClipboard = () => {
        if (user?.friendCode) {
            navigator.clipboard.writeText(user.friendCode);
            setCopySuccess("¡Copiado!");
            setTimeout(() => setCopySuccess(""), 2000);
        }
    };

    const handleStatusSelect = async (newStatus) => {
        setIsStatusMenuOpen(false);
        const token = localStorage.getItem("token");
        try {
            await fetch(`http://localhost:8080/api/auth/status?pref=${newStatus}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            refreshUser();
        } catch (error) {}
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'ACTIVE': return { text: 'Activo', colorClass: 'status-online' };
            case 'DND': return { text: 'No molestar', colorClass: 'status-dnd' };
            case 'INVISIBLE': return { text: 'Invisible', colorClass: 'status-offline' };
            default: return { text: 'Activo', colorClass: 'status-online' };
        }
    };

    if (!user) return <div className="loading">Cargando perfil...</div>;

    const currentStatus = getStatusConfig(user.statusPreference);

    return (
        <div className="profile-page-container">
            <Navbar 
                leftContent={
                    <button className="back-btn" onClick={() => navigate("/dashboard")}>← Volver al juego</button>
                }
                centerContent={<h1>Mi Perfil</h1>}
            />

            <div className="profile-content" style={{ marginTop: '40px' }}>
                <div className="profile-main-card">
                    <img
                        src={user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"}
                        alt="Avatar"
                        className="large-avatar"
                    />
                    <h2>{user.username}</h2>
                    <span className="badge-level">Nivel {user.level}</span>
                    
                    <div className="custom-status-dropdown" ref={dropdownRef}>
                        <div 
                            className="status-dropdown-header" 
                            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        >
                            <div className={`profile-status-dot ${currentStatus.colorClass}`}></div>
                            <span>{currentStatus.text}</span>
                            <span className="dropdown-arrow">{isStatusMenuOpen ? '▲' : '▼'}</span>
                        </div>
                        
                        {isStatusMenuOpen && (
                            <ul className="status-dropdown-list">
                                <li className="status-dropdown-item" onClick={() => handleStatusSelect('ACTIVE')}>
                                    <div className="profile-status-dot status-online"></div>
                                    <span>Activo</span>
                                </li>
                                <li className="status-dropdown-item" onClick={() => handleStatusSelect('DND')}>
                                    <div className="profile-status-dot status-dnd"></div>
                                    <span>No molestar</span>
                                </li>
                                <li className="status-dropdown-item" onClick={() => handleStatusSelect('INVISIBLE')}>
                                    <div className="profile-status-dot status-offline"></div>
                                    <span>Invisible</span>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                <div className="friend-code-section">
                    <h3>Tu Código de Amigo</h3>
                    <div className="code-display" onClick={copyToClipboard}>
                        <span className="code-text">{user.friendCode}</span>
                        <button className="copy-btn">📋</button>
                    </div>
                    {copySuccess && <span className="copy-msg">{copySuccess}</span>}
                    <p className="helper-text">Compártelo con tus amigos para que te añadan en Stars Fighters.</p>
                </div>

                <div className="account-details">
                    <div className="detail-item">
                        <label>Email</label>
                        <p>{user.email}</p>
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