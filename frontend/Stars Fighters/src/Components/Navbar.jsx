import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import bellIcon from "../assets/campana.svg"; 
import "../Styles/Notifications.css";
import "../Styles/App.css";

export default function Navbar() {
    const userContext = useUser();
    const notificationContext = useNotification();
    
    const user = userContext?.user || null;
    const bellList = notificationContext?.bellList || [];
    const removeBellItem = notificationContext?.removeBellItem || (() => {});
    const respondFriendRequest = notificationContext?.respondFriendRequest || (() => {});
    const respondGameInvite = notificationContext?.respondGameInvite || (() => {});

    const navigate = useNavigate();
    const [isBellOpen, setIsBellOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const desktopBellRef = useRef(null);
    const desktopProfileRef = useRef(null);
    const mobileBellRef = useRef(null);
    const mobileProfileRef = useRef(null);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedOutsideBell = (!desktopBellRef.current || !desktopBellRef.current.contains(e.target)) && 
                                       (!mobileBellRef.current || !mobileBellRef.current.contains(e.target));
            if (clickedOutsideBell) setIsBellOpen(false);

            const clickedOutsideProfile = (!desktopProfileRef.current || !desktopProfileRef.current.contains(e.target)) && 
                                          (!mobileProfileRef.current || !mobileProfileRef.current.contains(e.target));
            if (clickedOutsideProfile) setIsProfileOpen(false);

            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsProfileOpen(false);
        if (userContext?.logout) {
            userContext.logout();
        }
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    const renderBell = (ref) => (
        <div className="bell-container" ref={ref}>
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
    );

    const renderProfile = (ref) => (
        <div className="profile-dropdown-container" ref={ref}>
            <button className="profile-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <img src={user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Perfil" className="profile-img" />
                <div className="profile-info">
                    <span className="profile-name">{user.username}</span>
                    <span className="profile-level">{user.coins} 💰</span>
                </div>
            </button>

            {isProfileOpen && (
                <div className="profile-dropdown">
                    <button 
                        className="profile-dropdown-item" 
                        onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                    >
                        Ver Perfil
                    </button>
                    <button 
                        className="profile-dropdown-item danger" 
                        onClick={handleLogout}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <nav className="landing-navbar">
            <div className="nav-left">
                <Link to="/">
                    <img src="/logo.png" alt="Logo" className="nav-logo" />
                </Link>
                <div className="desktop-links">
                    <Link to="/resumen" className="nav-link">RESUMEN</Link>
                    <Link to="/campeones" className="nav-link">CAMPEONES</Link>
                    <Link to="/dashboard" className="nav-link">COMUNIDAD</Link>
                    <Link to="/store" className="nav-link">TIENDA</Link>
                </div>
            </div>

            <div className="nav-center">
                {user && (
                    <button className="play-btn" onClick={() => navigate("/play")}>
                        JUGAR
                    </button>
                )}
            </div>

            <div className="nav-right">
                {user ? (
                    <div className="desktop-user-controls">
                        {renderBell(desktopBellRef)}
                        {renderProfile(desktopProfileRef)}
                    </div>
                ) : (
                    <button className="play-now-btn desktop-only" onClick={() => navigate('/login')}>INICIAR SESIÓN</button>
                )}

                <div className="mobile-menu-container" ref={mobileMenuRef}>
                    <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        ☰
                    </button>
                    {isMobileMenuOpen && (
                        <div className="mobile-dropdown">
                            {user && (
                                <div className="mobile-user-row">
                                    {renderBell(mobileBellRef)}
                                    {renderProfile(mobileProfileRef)}
                                </div>
                            )}
                            <Link to="/resumen" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>RESUMEN</Link>
                            <Link to="/campeones" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>CAMPEONES</Link>
                            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>COMUNIDAD</Link>
                            <Link to="/store" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>TIENDA</Link>
                            {!user && (
                                <button className="mobile-play-now-btn" onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}>
                                    INICIAR SESIÓN
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}