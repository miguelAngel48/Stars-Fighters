import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import pencilIcon from "../assets/lapiz.svg";
import "../Styles/Profile.css";

export default function Profile() {
    const { user, refreshUser } = useUser();
    const [copySuccess, setCopySuccess] = useState("");
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const ApiUrl = import.env.VITE_API_URL

    const [localStatus, setLocalStatus] = useState("ACTIVE");

    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [newName, setNewName] = useState("");
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [availableAvatars, setAvailableAvatars] = useState([]);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/login");
        else fetchAvatars();
    }, [navigate]);

    useEffect(() => {
        if (user?.statusPreference) {
            setLocalStatus(user.statusPreference);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAvatars = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/users/avatars`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableAvatars(data);
            }
        } catch (error) { }
    };

    const copyToClipboard = () => {
        if (user?.friendCode) {
            navigator.clipboard.writeText(user.friendCode);
            setCopySuccess("¡Copiado!");
            setTimeout(() => setCopySuccess(""), 2000);
        }
    };

    const handleStatusSelect = async (newStatus) => {
        setIsStatusMenuOpen(false);
        setLocalStatus(newStatus);

        const token = localStorage.getItem("token");
        try {
            await fetch(`${ApiUrl}/api/auth/status?pref=${newStatus}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            refreshUser();
        } catch (error) { }
    };

    const handleAvatarChange = async (url) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/users/avatar`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ avatarUrl: url })
            });
            if (response.ok) {
                setIsAvatarModalOpen(false);
                refreshUser();
            }
        } catch (error) { }
    };

    const handleNameChange = async () => {
        setErrorMessage("");
        if (!newName.trim()) return;
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/users/username`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ newUsername: newName })
            });
            if (response.ok) {
                setIsNameModalOpen(false);
                refreshUser();
            } else {
                const data = await response.json();
                setErrorMessage(data.message);
            }
        } catch (error) { }
    };

    const handlePasswordChange = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage("Las contraseñas no coinciden");
            return;
        }
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/users/password`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            if (response.ok) {
                setSuccessMessage("Contraseña actualizada con éxito");
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setSuccessMessage("");
                }, 2000);
            } else {
                const data = await response.json();
                setErrorMessage(data.message);
            }
        } catch (error) { }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'ACTIVE': return { text: 'Activo', colorClass: 'status-online' };
            case 'DND': return { text: 'No molestar', colorClass: 'status-dnd' };
            case 'INVISIBLE': return { text: 'Invisible', colorClass: 'status-offline' };
            default: return { text: 'Activo', colorClass: 'status-online' };
        }
    };

    if (!user) return <div className="loading">Cargando perfil...</div>;

    const currentStatusConfig = getStatusConfig(localStatus);
    const avatarToDisplay = user.equippedAvatarUrl || user.avatarUrl || `${ApiUrl}/uploads/cosmetics/default-avatar.png`;

    return (
        <div className="profile-page-container" style={{ padding: '40px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                >
                    ← Volver
                </button>
                <h1 style={{ color: 'var(--color-accent)', textTransform: 'uppercase', margin: 0 }}>Mi Perfil</h1>
                <div style={{ width: '80px' }}></div>
            </div>

            <div className="profile-content">
                <div className="profile-main-card">
                    <div className="avatar-container" onClick={() => setIsAvatarModalOpen(true)}>
                        <img
                            src={avatarToDisplay}
                            alt="Avatar"
                            className="large-avatar"
                        />
                        <div className="avatar-overlay">
                            <span>Cambiar</span>
                        </div>
                    </div>

                    <div className="username-container">
                        <h2>{user.username}</h2>
                        <img
                            src={pencilIcon}
                            alt="Editar nombre"
                            className="edit-icon"
                            onClick={() => {
                                setNewName(user.username);
                                setIsNameModalOpen(true);
                                setErrorMessage("");
                            }}
                        />
                    </div>

                    <span className="badge-level">Nivel {user.level}</span>

                    <div className="custom-status-dropdown" ref={dropdownRef}>
                        <div
                            className="status-dropdown-header"
                            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        >
                            <div className={`profile-status-dot ${currentStatusConfig.colorClass}`}></div>
                            <span>{currentStatusConfig.text}</span>
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
                    <p className="helper-text">Compártelo con tus amigos para que te añadan.</p>
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
                    {user?.hasPassword && (
                        <div className="detail-item" style={{ borderBottom: 'none' }}>
                            <button className="btn-change-password" onClick={() => {
                                setIsPasswordModalOpen(true);
                                setErrorMessage("");
                                setSuccessMessage("");
                            }}>
                                Cambiar Contraseña
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isAvatarModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: 'var(--color-accent)' }}>Selecciona tu Avatar</h3>
                        {availableAvatars.length === 0 ? (
                            <p style={{ color: "var(--text-muted)" }}>No tienes avatares disponibles.</p>
                        ) : (
                            <div className="avatar-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', margin: '20px 0' }}>
                                {availableAvatars.map((url, idx) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Avatar ${idx}`}
                                        className={`avatar-option ${avatarToDisplay === url ? 'selected' : ''}`}
                                        onClick={() => handleAvatarChange(url)}
                                        style={{
                                            width: '80px', height: '80px', borderRadius: '50%', cursor: 'pointer',
                                            border: avatarToDisplay === url ? '3px solid var(--color-primary)' : '2px solid transparent',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button className="btn-cancel" onClick={() => setIsAvatarModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {isNameModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: 'var(--color-accent)' }}>Cambiar Nombre de Usuario</h3>
                        <div className="modal-input-container">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nuevo nombre"
                                className="modal-input"
                            />
                        </div>
                        {errorMessage && <span className="error-message" style={{ display: 'block', marginBottom: '15px' }}>{errorMessage}</span>}
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsNameModalOpen(false)}>Cancelar</button>
                            <button className="btn-add" onClick={handleNameChange}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: 'var(--color-accent)' }}>Cambiar Contraseña</h3>

                        <div className="modal-input-container" style={{ marginBottom: '15px' }}>
                            <input
                                type="password"
                                placeholder="Contraseña Actual"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="modal-input"
                            />
                        </div>
                        <div className="modal-input-container" style={{ marginBottom: '15px' }}>
                            <input
                                type="password"
                                placeholder="Nueva Contraseña"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="modal-input"
                            />
                        </div>
                        <div className="modal-input-container" style={{ marginBottom: '20px' }}>
                            <input
                                type="password"
                                placeholder="Confirmar Nueva Contraseña"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="modal-input"
                            />
                        </div>

                        {errorMessage && <span className="error-message" style={{ display: 'block', marginBottom: '15px' }}>{errorMessage}</span>}
                        {successMessage && <span style={{ color: '#22c55e', display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>{successMessage}</span>}

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</button>
                            <button className="btn-add" onClick={handlePasswordChange}>Actualizar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}