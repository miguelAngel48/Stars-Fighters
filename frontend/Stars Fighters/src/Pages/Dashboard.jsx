import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useWebSocket } from "../contexts/WebSocketContext";
import "../Styles/Dashboard.css";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const navigate = useNavigate();

    const [friends, setFriends] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFriendIdentifier, setNewFriendIdentifier] = useState("");
    const [addFriendMessage, setAddFriendMessage] = useState("");

    const [searchTimeout, setSearchTimeout] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    const [incomingRequests, setIncomingRequests] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [gameInvites, setGameInvites] = useState([]);

    const messagesEndRef = useRef(null);
    const { clientRef, isConnected, disconnect } = useWebSocket();

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

            fetch("http://localhost:8080/api/auth/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(profileData => {
                    setUser({
                        username: profileData.username,
                        email: profileData.email,
                        coins: profileData.coins,
                        avatar: profileData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.username}`
                    });
                })
                .catch(() => {

                    setUser({
                        username: decoded.sub || "Usuario",
                        email: decoded.email,
                        coins: decoded.coins || 0,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.sub}`
                    });
                });

        } catch (error) {
            handleLogout();
        }
    }, [navigate]);

    useEffect(() => {
        if (isConnected && clientRef.current) {
            const token = localStorage.getItem("token");

            const notifSub = clientRef.current.subscribe('/user/queue/notifications', (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);
                    if (notification.type === 'NEW_REQUEST') {
                        setIncomingRequests(prev => [...prev, notification]);
                    } else if (notification.type === 'REQUEST_ACCEPTED') {
                        fetchFriends(token);
                    } else if (notification.type === 'GAME_INVITE') {
                        setGameInvites(prev => [...prev, notification]);
                    } else if (notification.type === 'PRESENCE') {
                        setFriends(prevFriends =>
                            prevFriends.map(friend =>
                                friend.username === notification.username
                                    ? { ...friend, currentStatus: notification.status }
                                    : friend
                            )
                        );
                    }
                }
            });

            const msgSub = clientRef.current.subscribe('/user/queue/messages', (message) => {
                if (message.body) {
                    const newMsg = JSON.parse(message.body);
                    setMessages(prev => [...prev, newMsg]);
                }
            });

            fetchFriends(token);
            fetchPendingRequests(token);

            return () => {
                notifSub.unsubscribe();
                msgSub.unsubscribe();
            };
        }
    }, [isConnected, clientRef]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        disconnect();
        navigate("/login");
    };

    const handleRespondGameInvite = async (leaderId, lobbyId, senderName, accepted) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/lobby/respond/${leaderId}?accepted=${accepted}&lobbyId=${lobbyId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setGameInvites(prev => prev.filter(inv => inv.lobbyId !== lobbyId));
                if (accepted) {
                    navigate(`/lobby?role=guest&lobbyId=${lobbyId}&leaderId=${leaderId}&leaderName=${senderName}`);
                }
            }
        } catch (error) { }
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
        } catch (error) { }
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
        } catch (error) { }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setNewFriendIdentifier(val);

        if (searchTimeout) clearTimeout(searchTimeout);

        if (val.trim().length > 1 && !val.startsWith('#')) {
            setSearchTimeout(setTimeout(() => {
                fetchSearchResults(val);
            }, 300));
        } else {
            setSearchResults([]);
        }
    };

    const fetchSearchResults = async (query) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/users/search?query=${query}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) { }
    };

    const selectUser = (friendCode) => {
        setNewFriendIdentifier(friendCode);
        setSearchResults([]);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setAddFriendMessage("");
        setNewFriendIdentifier("");
        setSearchResults([]);
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
                setSearchResults([]);
                setTimeout(() => {
                    closeModal();
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
        } catch (error) { }
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
        } catch (error) { }
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !activeChat || !clientRef.current) return;

        const messagePayload = {
            friendshipId: activeChat.friendshipId,
            receiverUsername: activeChat.username,
            content: newMessage
        };

        clientRef.current.publish({
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
                    <button className="nav-btn" onClick={() => navigate("/store")}>Tienda</button>
                </div>
                <div className="nav-center">
                    <button className="play-btn" onClick={() => navigate("/Lobby")}>Jugar</button>
                </div>
                <div className="nav-right">
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        <img src={user.avatar} alt="Perfil" className="profile-img" />
                        <div className="profile-info">
                            <span className="profile-name">{user.username}</span>
                            <span className="profile-level">🪙{user.coins}</span>
                        </div>
                    </button>
                </div>
            </nav>

            <div className="dashboard-body">
                <main className="main-content">
                    <h1>Bienvenido a tu Dashboard</h1>
                    <div className="user-card">
                        <h3>Tu Perfil</h3>
                        <p><strong>Usuario (sub):</strong> {user.username}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <button className="btn-logout" onClick={handleLogout}>
                            Cerrar Sesión
                        </button>
                    </div>
                </main>

                <aside className="friends-sidebar">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="sidebar-title">Amistades</h3>
                        <button onClick={() => setIsModalOpen(true)} className="btn-add-friend-sidebar">+</button>
                    </div>

                    <ul className="friends-list">
                        {friends.length === 0 ? (
                            <li className="no-friends" style={{ padding: '10px', color: '#888' }}>No tienes amistades aún.</li>
                        ) : (
                            friends.map((friend) => (
                                <li key={friend.id} className="friend-item" onClick={() => handleFriendClick(friend)}>
                                    <div className="friend-avatar-container">
                                        <img src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Avatar" className="friend-avatar" />
                                        <div className={`status-dot ${friend.currentStatus || 'OFFLINE'}`}></div>
                                    </div>
                                    <span>{friend.username}</span>
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
                            <button className="btn-accept" onClick={() => handleRespondRequest(request.friendshipId, true)}>Aceptar</button>
                            <button className="btn-reject" onClick={() => handleRespondRequest(request.friendshipId, false)}>Rechazar</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="toast-container" style={{ bottom: '220px' }}>
                {gameInvites.map((invite) => (
                    <div key={invite.lobbyId} className="toast" style={{ borderLeft: '5px solid var(--color-primary)' }}>
                        <h4 style={{ color: 'var(--color-primary)' }}>¡Desafío de Pelea!</h4>
                        <p><strong>{invite.senderName}</strong> te invita a una partida.</p>
                        <div className="toast-actions">
                            <button className="btn-accept" onClick={() => handleRespondGameInvite(invite.senderId, invite.lobbyId, invite.senderName, true)}>Aceptar</button>
                            <button className="btn-reject" onClick={() => handleRespondGameInvite(invite.senderId, invite.lobbyId, invite.senderName, false)}>Rechazar</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Añadir nueva amistad</h3>
                        <p>Introduce el nombre de usuario o código (ej: #1234-5678) para buscarlo.</p>

                        <div className="modal-input-container">
                            <input
                                type="text"
                                placeholder="Nombre o código..."
                                value={newFriendIdentifier}
                                onChange={handleSearchChange}
                                className="modal-input"
                            />
                            {searchResults.length > 0 && (
                                <ul className="autocomplete-dropdown">
                                    {searchResults.map((result) => (
                                        <li
                                            key={result.friendCode}
                                            className="autocomplete-item"
                                            onClick={() => selectUser(result.friendCode)}
                                        >
                                            <span className="autocomplete-username">{result.username}</span>
                                            <span className="autocomplete-code">{result.friendCode}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {addFriendMessage && (
                            <p className={addFriendMessage.includes('éxito') ? 'success-text' : 'error-text'}>
                                {addFriendMessage}
                            </p>
                        )}

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={closeModal}>Cancelar</button>
                            <button className="btn-add" onClick={handleAddFriend}>Añadir</button>
                        </div>
                    </div>
                </div>
            )}

            {activeChat && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Chat con {activeChat.username}</span>
                        <button className="close-chat-btn" onClick={() => setActiveChat(null)}>✖</button>
                    </div>
                    <div className="chat-body">
                        {messages.filter(m => m.friendshipId === activeChat.friendshipId).length === 0 ? (
                            <p className="chat-placeholder">Inicia una conversación con {activeChat.username}...</p>
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