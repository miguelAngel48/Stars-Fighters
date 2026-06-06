import React from "react";
import { Outlet } from "react-router-dom";
import { NotificationProvider, useNotification } from "../contexts/NotificationContext";

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
    return (
        <NotificationProvider>
            <Outlet />
            <ToastsRenderer />
        </NotificationProvider>
    );
}