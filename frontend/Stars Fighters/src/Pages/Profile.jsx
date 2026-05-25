import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Profile.css";

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [copySuccess, setCopySuccess] = useState("");
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
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
            }
        };

        fetchProfile();
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
        if (userData?.friendCode) {
            navigator.clipboard.writeText(userData.friendCode);
            setCopySuccess("¡Copiado!");
            setTimeout(() => setCopySuccess(""), 2000);
        }
    };

    const handleStatusSelect = async (newStatus) => {
        setUserData(prev => ({ ...prev, statusPreference: newStatus }));
        setIsStatusMenuOpen(false);
        
        const token = localStorage.getItem("token");
        try {
            await fetch(`http://localhost:8080/api/auth/status?pref=${newStatus}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (error) {
        }
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'ACTIVE': return { text: 'Activo', colorClass: 'status-online' };
            case 'DND': return { text: 'No molestar', colorClass: 'status-dnd' };
            case 'INVISIBLE': return { text: 'Invisible', colorClass: 'status-offline' };
            default: return { text: 'Activo', colorClass: 'status-online' };
        }
    };

    if (!userData) return <div className="loading">Cargando perfil...</div>;

    const currentStatus = getStatusConfig(userData.statusPreference);

    return (
        <div className="profile-page-container">
            <header className="profile-header">
                <button className="back-btn" onClick={() => navigate("/dashboard")}>
                    ← Volver al juego
                </button>
                <h1>Mi Perfil</h1>
            </header>

            <div className="profile-content">
                <div className="profile-main-card">
                    <img
                        src={userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`}
                        alt="Avatar"
                        className="large-avatar"
                    />
                    <h2>{userData.username}</h2>
                    <span className="badge-level">Nivel {userData.level}</span>
                    
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