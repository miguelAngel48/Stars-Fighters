import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import bellIcon from "../assets/campana.svg"; 
import "../Styles/Notifications.css";

export default function Navbar({ leftContent, centerContent }) {
    const { user } = useUser();
    const { bellList, removeBellItem, respondFriendRequest, respondGameInvite } = useNotification();
    const navigate = useNavigate();
    const [isBellOpen, setIsBellOpen] = useState(false);
    const bellRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) setIsBellOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return <nav className="navbar"></nav>;

    return (
        <nav className="navbar">
            <div className="nav-left">{leftContent}</div>
            <div className="nav-center">{centerContent}</div>
            <div className="nav-right">
                <div className="bell-container" ref={bellRef}>
                    {/* 2. Reemplazamos el contenido del botón por la imagen */}
                    <button className="bell-btn" onClick={() => setIsBellOpen(!isBellOpen)}>
                        <img src={bellIcon} alt="Notificaciones" style={{ width: '24px', height: '24px' }} />
                        {bellList.length > 0 && <span className="bell-badge">{bellList.length}</span>}
                    </button>
                    
                    {isBellOpen && (
                        <div className="bell-dropdown">
                            <h4>Notificaciones</h4>
                            {bellList.length === 0 ? (
                                <p className="no-notifs">No tienes notificaciones.</p>
                            ) : (
                                <ul>
                                    {bellList.map(item => (
                                        <li key={item.id} className="bell-item">
                                            <button className="close-btn" onClick={() => removeBellItem(item.id)}>✖</button>
                                            <p>{item.text}</p>
                                            {item.hasActions && (
                                                <div className="bell-actions">
                                                    <button className="btn-accept" onClick={() => item.type === 'NEW_REQUEST' ? respondFriendRequest(item, true) : respondGameInvite(item, true)}>Aceptar</button>
                                                    <button className="btn-reject" onClick={() => item.type === 'NEW_REQUEST' ? respondFriendRequest(item, false) : respondGameInvite(item, false)}>Rechazar</button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <button className="profile-btn" onClick={() => navigate("/profile")}>
                    <img src={user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Perfil" className="profile-img" />
                    <div className="profile-info">
                        <span className="profile-name">{user.username}</span>
                        <span className="profile-level">{user.coins} 💰</span>
                    </div>
                </button>
            </div>
        </nav>
    );
}