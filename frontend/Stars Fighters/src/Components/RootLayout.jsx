import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NotificationProvider, useNotification } from "../contexts/NotificationContext";
import Navbar from "./Navbar";
import SocialSidebar from "./SocialSidebar";

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

export default function RootLayout() {
    const location = useLocation();
    const hideUI = ["/lobby", "/game", "/character-selection"].includes(location.pathname);

    return (
        <NotificationProvider>
            <div className="dashboard-container">
                {!hideUI && <Navbar />}
                <div className="dashboard-body" style={hideUI ? { height: '100vh', width: '100vw', display: 'flex' } : { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div className="main-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Outlet />
                    </div>
                    {!hideUI && <SocialSidebar />}
                </div>
            </div>
            <ToastsRenderer />
        </NotificationProvider>
    );
}