import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import "../Styles/Dashboard.css";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const navigate = useNavigate();

    const [friends, setFriends] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFriendIdentifier, setNewFriendIdentifier] = useState("");
    const [addFriendMessage, setAddFriendMessage] = useState("");

    const [incomingRequests, setIncomingRequests] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
                handleLogout();
                return;
            }

            setUser({
                ...decoded,
                username: decoded.sub || "Usuario",
                level: decoded.level,
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            });

            fetchFriends(token);
            fetchPendingRequests(token);
            connectWebSocket(token);

        } catch (error) {
            handleLogout();
        }

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const connectWebSocket = (token) => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-stars'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe('/user/queue/notifications', (message) => {
                    if (message.body) {
                        const notification = JSON.parse(message.body);
                        if (notification.type === 'NEW_REQUEST') {
                            setIncomingRequests(prev => [...prev, notification]);
                        } else if (notification.type === 'REQUEST_ACCEPTED') {
                            fetchFriends(token);
                        }
                    }
                });

                client.subscribe('/user/queue/messages', (message) => {
                    if (message.body) {
                        const newMsg = JSON.parse(message.body);
                        setMessages(prev => [...prev, newMsg]);
                    }
                });
            }
        });

        client.activate();
        stompClientRef.current = client;
    };

    const fetchPendingRequests = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/friendships/pending", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIncomingRequests(data);
            }
        } catch (error) {}
    };

    const fetchFriends = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/friendships", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) {}
    };

    const handleAddFriend = async () => {
        if (!newFriendIdentifier.trim()) return;
        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:8080/api/friendships/request", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ friendCode: newFriendIdentifier })
            });

            if (response.ok) {
                setAddFriendMessage("¡Solicitud enviada con éxito!");
                setNewFriendIdentifier("");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setAddFriendMessage("");
                }, 1500);
            } else {
                const errorData = await response.text();
                setAddFriendMessage(errorData || "Error al enviar la solicitud.");
            }
        } catch (error) {
            setAddFriendMessage("Error de conexión con el servidor.");
        }
    };

    const handleRespondRequest = async (requestId, accepted) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/friendships/respond/${requestId}?accepted=${accepted}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setIncomingRequests(prev => prev.filter(req => req.friendshipId !== requestId));
                if (accepted) {
                    fetchFriends(token);
                }
            }
        } catch (error) {}
    };

    const handleFriendClick = async (friend) => {
        setActiveChat(friend);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/chat/${friend.friendshipId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(prev => {
                    const filtered = prev.filter(m => m.friendshipId !== friend.friendshipId);
                    return [...filtered, ...data];
                });
            }
        } catch (error) {}
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !activeChat || !stompClientRef.current) return;

        const messagePayload = {
            friendshipId: activeChat.friendshipId,
            receiverUsername: activeChat.username || activeChat.name,
            content: newMessage
        };

        stompClientRef.current.publish({
            destination: "/app/chat.private",
            body: JSON.stringify(messagePayload)
        });

        setNewMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    if (!user) return <div className="loading">Cargando perfil...</div>;

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="nav-left">
                    <button className="nav-btn" onClick={() => navigate("/dashboard")}>Dashboard</button>
                    <button className="nav-btn" onClick={() => console.log("Ir a tienda")}>Tienda</button>
                </div>
                <div className="nav-center">
                    <button className="play-btn">Jugar</button>
                </div>
                <div className="nav-right">
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        <img src={user.avatar} alt="Perfil" className="profile-img" />
                        <div className="profile-info">
                            <span className="profile-name">{user.username}</span>
                            <span className="profile-level">Nvl. {user.level}</span>
                        </div>
                    </button>
                </div>
            </nav>

            <div className="dashboard-body">
                <main className="main-content">
                    <h1>Bienvenido a tu Dashboard</h1>
                    <div className="user-card">
                        <h3>Tu Perfil</h3>
                        <p><strong>Usuario (sub):</strong> {user.sub}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <button className="btn-logout" onClick={handleLogout}>
                            Cerrar Sesión
                        </button>
                    </div>
                </main>

                <aside className="friends-sidebar">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="sidebar-title">Amistades</h3>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-add-friend-sidebar"
                        >
                            +
                        </button>
                    </div>

                    <ul className="friends-list">
                        {friends.length === 0 ? (
                            <li className="no-friends" style={{ padding: '10px', color: '#888' }}>No tienes amistades aún.</li>
                        ) : (
                            friends.map((friend) => (
                                <li key={friend.id} className="friend-item" onClick={() => handleFriendClick(friend)}>
                                    <div className={`status-dot ${friend.status || 'offline'}`}></div>
                                    <span>{friend.username || friend.name}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </aside>
            </div>

            <div className="toast-container">
                {incomingRequests.map((request) => (
                    <div key={request.friendshipId} className="toast">
                        <h4>¡Nueva solicitud!</h4>
                        <p><strong>{request.senderName}</strong> quiere ser tu amigo.</p>
                        <div className="toast-actions">
                            <button className="btn-accept" onClick={() => handleRespondRequest(request.friendshipId, true)}>
                                Aceptar
                            </button>
                            <button className="btn-reject" onClick={() => handleRespondRequest(request.friendshipId, false)}>
                                Rechazar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Añadir nueva amistad</h3>
                        <p>Introduce el código de amigo (ej: #1234-5678) para buscarlo en Stars Fighters.</p>

                        <input
                            type="text"
                            placeholder="Ej: #1234-5678"
                            value={newFriendIdentifier}
                            onChange={(e) => setNewFriendIdentifier(e.target.value)}
                            className="modal-input"
                        />

                        {addFriendMessage && (
                            <p className={addFriendMessage.includes('éxito') ? 'success-text' : 'error-text'}>
                                {addFriendMessage}
                            </p>
                        )}

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => { setIsModalOpen(false); setAddFriendMessage(""); }}>
                                Cancelar
                            </button>
                            <button className="btn-add" onClick={handleAddFriend}>
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeChat && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Chat con {activeChat.username || activeChat.name}</span>
                        <button className="close-chat-btn" onClick={() => setActiveChat(null)}>✖</button>
                    </div>
                    <div className="chat-body">
                        {messages.filter(m => m.friendshipId === activeChat.friendshipId).length === 0 ? (
                            <p className="chat-placeholder">Inicia una conversación con {activeChat.username || activeChat.name}...</p>
                        ) : (
                            <div className="messages-container">
                                {messages
                                    .filter(m => m.friendshipId === activeChat.friendshipId)
                                    .map((msg, idx) => (
                                        <div key={idx} className={`message ${msg.senderUsername === user.username ? 'sent' : 'received'}`}>
                                            {msg.content}
                                        </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                    <div className="chat-input">
                        <input 
                            type="text" 
                            placeholder="Escribe un mensaje..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={sendMessage}>Enviar</button>
                    </div>
                </div>
            )}
        </div>
    );
}