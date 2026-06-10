import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NotificationProvider, useNotification } from "../contexts/NotificationContext";
import Navbar from "./Navbar";
import SocialSidebar from "./SocialSidebar";
import Footer from "./Footer";

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
    const hideNavbarSidebar = ["/lobby", "/game", "/character-selection"].includes(location.pathname);
    const hideFooter = ["/game"].includes(location.pathname);

    return (
        <NotificationProvider>
            <div className="dashboard-container">
                {!hideNavbarSidebar && <Navbar />}
                <div className="dashboard-body" style={hideNavbarSidebar ? { display: 'flex', flex: 1, overflow: 'hidden' } : { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div className="main-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Outlet />
                        </div>
                        {!hideFooter && <Footer />}
                    </div>
                    {!hideNavbarSidebar && <SocialSidebar />}
                </div>
            </div>
            <ToastsRenderer />
        </NotificationProvider>
    );
}