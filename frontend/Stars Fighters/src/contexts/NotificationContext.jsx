// Nueva carpeta (2)/src frontend/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "./WebSocketContext";
import { useUser } from "./UserContext";
import notificationSound from "../assets/notification.mp3";

const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [bellList, setBellList] = useState([]);
    const [toastList, setToastList] = useState([]);
    const [latestEvent, setLatestEvent] = useState(null);
    const chatNotifiedRef = useRef(new Set());

    const { clientRef, isConnected } = useWebSocket();
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/api/friendships/pending", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const items = data.map(req => ({
                type: 'NEW_REQUEST',
                friendshipId: req.friendshipId,
                senderName: req.friendCode,
                id: Date.now() + Math.random(),
                text: `${req.friendCode} quiere ser tu amigo.`,
                hasActions: true
            }));
            setBellList(prev => [...items, ...prev]);
        }).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!isConnected || !clientRef.current || !user) return;

        const sub = clientRef.current.subscribe('/user/queue/notifications', (message) => {
            if (message.body) {
                const notif = JSON.parse(message.body);
                setLatestEvent(notif);

                if (notif.type === 'START_SELECTION') {
                    navigate(`/character-selection?lobbyId=${notif.lobbyId}&role=guest&oppName=Líder`);
                    return;
                }

                if (notif.type === 'LOBBY_CLOSED' || notif.type === 'GUEST_KICKED') {
                    setBellList(prev => prev.filter(item => !(item.type === 'GAME_INVITE' && item.senderName === notif.senderName)));
                    setToastList(prev => prev.filter(item => !(item.type === 'GAME_INVITE' && item.senderName === notif.senderName)));

                    if (window.location.pathname !== '/lobby') {
                        return;
                    }
                }

                let text = "";
                let hasActions = false;

                switch(notif.type) {
                    case 'NEW_REQUEST': text = `${notif.senderName} quiere ser tu amigo.`; hasActions = true; break;
                    case 'GAME_INVITE': text = `${notif.senderName} te invita a jugar.`; hasActions = true; break;
                    case 'REQUEST_ACCEPTED': text = `${notif.friendName} aceptó tu solicitud.`; break;
                    case 'GAME_ACCEPTED': text = `${notif.senderName} aceptó tu invitación.`; break;
                    case 'GAME_REJECTED': text = `${notif.senderName} rechazó tu invitación.`; break;
                    case 'LOBBY_CLOSED': text = `${notif.senderName} cerró la sala.`; break;
                    case 'GUEST_LEFT': text = `${notif.senderName} abandonó la sala.`; break;
                    case 'GUEST_KICKED': text = `Has sido expulsado de la sala.`; break;
                    default: return; 
                }

                const newId = Date.now() + Math.random();
                const bellItem = { ...notif, id: newId, text, hasActions };

                setBellList(prev => [bellItem, ...prev]);

                const pref = user.statusPreference || "ACTIVE";
                
                if (pref === "ACTIVE" || pref === "DND") {
                    setToastList(prev => [...prev, bellItem]);
                    
                    if (pref === "ACTIVE") {
                        const audio = new Audio(notificationSound);
                        audio.play().catch(() => {});
                    }

                    setTimeout(() => {
                        setToastList(prev => prev.filter(t => t.id !== newId));
                    }, 5000);
                }
            }
        });

        return () => sub.unsubscribe();
    }, [isConnected, clientRef, user, navigate]);

    const removeBellItem = (id) => setBellList(prev => prev.filter(i => i.id !== id));
    const removeToast = (id) => setToastList(prev => prev.filter(i => i.id !== id));

    const respondFriendRequest = async (item, accepted) => {
        removeBellItem(item.id);
        removeToast(item.id);
        const token = localStorage.getItem("token");
        try {
            await fetch(`http://localhost:8080/api/friendships/respond/${item.friendshipId}?accepted=${accepted}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (accepted) {
                setLatestEvent({ type: 'REFRESH_FRIENDS' });
            }
        } catch (e) {}
    };

    const respondGameInvite = async (item, accepted) => {
        removeBellItem(item.id);
        removeToast(item.id);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:8080/api/lobby/respond/${item.senderId}?accepted=${accepted}&lobbyId=${item.lobbyId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok && accepted) {
                navigate(`/lobby?role=guest&lobbyId=${item.lobbyId}&leaderId=${item.senderId}&leaderName=${item.senderName}`);
            }
        } catch (e) {}
    };

    const addChatNotification = useCallback((senderName, friendshipId, isChatOpen) => {
        if (isChatOpen) return;
        if (chatNotifiedRef.current.has(friendshipId)) return;

        chatNotifiedRef.current.add(friendshipId);

        const newId = Date.now() + Math.random();
        const bellItem = { 
            type: 'CHAT_MESSAGE', 
            id: newId, 
            text: `Recibiste un mensaje de ${senderName}.`, 
            hasActions: false,
            friendshipId
        };

        setBellList(prev => [bellItem, ...prev]);

        const pref = user?.statusPreference || "ACTIVE";
        if (pref === "ACTIVE" || pref === "DND") {
            setToastList(prev => [...prev, bellItem]);
            
            if (pref === "ACTIVE") {
                const audio = new Audio(notificationSound);
                audio.play().catch(() => {});
            }

            setTimeout(() => {
                setToastList(prev => prev.filter(t => t.id !== newId));
            }, 5000);
        }
    }, [user]);

    const clearChatNotification = useCallback((friendshipId) => {
        if (chatNotifiedRef.current.has(friendshipId)) {
            chatNotifiedRef.current.delete(friendshipId);
            setBellList(prev => prev.filter(i => !(i.type === 'CHAT_MESSAGE' && i.friendshipId === friendshipId)));
            setToastList(prev => prev.filter(i => !(i.type === 'CHAT_MESSAGE' && i.friendshipId === friendshipId)));
        }
    }, []);

    return (
        <NotificationContext.Provider value={{
            bellList, toastList, latestEvent, removeBellItem, removeToast, respondFriendRequest, respondGameInvite,
            addChatNotification, clearChatNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};