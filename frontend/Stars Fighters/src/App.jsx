import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Components/Navbar';
import SocialSidebar from './Components/SocialSidebar';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { useUser } from './contexts/UserContext';
import './Styles/App.css';

function ToastsRenderer() {
    const { toastList, removeToast, respondFriendRequest, respondGameInvite } = useNotification();
    
    return (
        <div className="global-toast-container">
            {toastList.map(t => (
                <div key={t.id} className="global-toast">
                    <button className="toast-close" onClick={() => removeToast(t.id)}>✖</button>
                    <p>{t.text}</p>
                    {t.hasActions && (
                        <div className="toast-actions">
                            <button className="btn-accept" onClick={() => t.type === 'NEW_REQUEST' ? respondFriendRequest(t, true) : respondGameInvite(t, true)}>Aceptar</button>
                            <button className="btn-reject" onClick={() => t.type === 'NEW_REQUEST' ? respondFriendRequest(t, false) : respondGameInvite(t, false)}>Rechazar</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

const AppContent = () => {
    const navigate = useNavigate();
    const userContext = useUser();
    const user = userContext?.user || null;

    return (
        <div className="dashboard-container landing-container">
            <Navbar />
            <div className="dashboard-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                <main className="hero-section main-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div className="hero-content">
                        <img src="/logo.png" alt="Main Logo" className="main-logo" />
                        <h1 className="hero-subtitle">UN UNIVERSO DE ESTRATEGIA Y COMBATE</h1>
                        <button className="play-free-btn" onClick={() => navigate(user ? '/play' : '/register')}>
                            {user ? 'JUGAR' : 'JUGAR GRATIS'}
                        </button>
                    </div>
                </main>
                {user && <SocialSidebar />}
            </div>
            <ToastsRenderer />
        </div>
    );
};

const App = () => {
    return (
        <NotificationProvider>
            <AppContent />
        </NotificationProvider>
    );
};

export default App;