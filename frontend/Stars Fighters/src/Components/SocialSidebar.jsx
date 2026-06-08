import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useNotification } from "../contexts/NotificationContext";
import { useUser } from "../contexts/UserContext";

export default function SocialSidebar() {
    const { user } = useUser();
    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(null);
    const navigate = useNavigate();

    const [friends, setFriends] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFriendIdentifier, setNewFriendIdentifier] = useState("");
    const [addFriendMessage, setAddFriendMessage] = useState("");

    const [searchTimeout, setSearchTimeout] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const messagesEndRef = useRef(null);
    const { clientRef, isConnected } = useWebSocket();
    const { latestEvent, addChatNotification, clearChatNotification } = useNotification();

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        activeChatRef.current = activeChat;
        if (activeChat) {
            clearChatNotification(activeChat.friendshipId);
        }
    }, [activeChat, clearChatNotification]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem("token");
        fetchFriends(token);
    }, [user]);

    useEffect(() => {
        if (latestEvent?.type === 'PRESENCE' || latestEvent?.type === 'REFRESH_FRIENDS' || latestEvent?.type === 'REQUEST_ACCEPTED') {
            const token = localStorage.getItem("token");
            fetchFriends(token);
        }
    }, [latestEvent]);

    useEffect(() => {
        if (isConnected && clientRef.current && user) {
            const msgSub = clientRef.current.subscribe('/user/queue/messages', (message) => {
                if (message.body) {
                    const newMsg = JSON.parse(message.body);
                    setMessages(prev => [...prev, newMsg]);

                    if (newMsg.senderUsername !== user.username) {
                        const isChatOpen = activeChatRef.current?.friendshipId === newMsg.friendshipId;
                        addChatNotification(newMsg.senderUsername, newMsg.friendshipId, isChatOpen);
                    }
                }
            });
            return () => msgSub.unsubscribe();
        }
    }, [isConnected, clientRef, user, addChatNotification]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchFriends = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/friendships", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) {}
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
        } catch (error) {}
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
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ friendCode: newFriendIdentifier })
            });

            if (response.ok) {
                setAddFriendMessage("¡Solicitud enviada con éxito!");
                setNewFriendIdentifier("");
                setSearchResults([]);
                setTimeout(() => closeModal(), 1500);
            } else {
                const data = await response.json();
                setAddFriendMessage(data.message || "Error al enviar la solicitud.");
            }
        } catch (error) {
            setAddFriendMessage("Error de conexión con el servidor.");
        }
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

    const handleRemoveFriend = async (friendshipId, e) => {
        if (e) e.stopPropagation();
        
        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        if (activeChat && activeChat.friendshipId === friendshipId) {
            setActiveChat(null);
        }
        setOpenDropdownId(null);

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/friendships/${friendshipId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchFriends(token);
        } catch (error) {
            fetchFriends(token);
        }
    };

    if (!user) return null;

    return (
        <>
            <aside className={`friends-sidebar ${isCollapsed ? "collapsed" : ""}`}>
                <button 
                    className="sidebar-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? "◀" : "▶"}
                </button>

                <div className="sidebar-content-wrapper">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="sidebar-title">Amistades</h3>
                        <button onClick={() => setIsModalOpen(true)} className="btn-add-friend-sidebar">+</button>
                    </div>

                    <ul className="friends-list">
                        {friends.length === 0 ? (
                            <li className="no-friends" style={{ padding: '20px', color: '#888', textAlign: 'center' }}>No tienes amistades aún.</li>
                        ) : (
                            friends.map((friend) => (
                                <li key={friend.id} className="friend-item" onClick={() => handleFriendClick(friend)}>
                                    <div className="friend-info-left">
                                        <div className="friend-avatar-container">
                                            <img src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Avatar" className="friend-avatar" />
                                            <div className={`status-dot ${friend.currentStatus || 'OFFLINE'}`}></div>
                                        </div>
                                        <span>{friend.username}</span>
                                    </div>

                                    <div className="friend-options-container" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            className="friend-options-btn" 
                                            onClick={() => setOpenDropdownId(openDropdownId === friend.id ? null : friend.id)}
                                        >
                                            ⋮
                                        </button>
                                        
                                        {openDropdownId === friend.id && (
                                            <div className="friend-dropdown-menu">
                                                <button className="dropdown-item" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    navigate(`/friend-profile/${friend.username}`, { state: { friend } });
                                                }}>
                                                    Ver perfil
                                                </button>
                                                <button className="dropdown-item danger" onClick={(e) => handleRemoveFriend(friend.friendshipId, e)}>
                                                    Cancelar amistad
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </aside>

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
                                        <li key={result.friendCode} className="autocomplete-item" onClick={() => selectUser(result.friendCode)}>
                                            <span className="autocomplete-username">{result.username}</span>
                                            <span className="autocomplete-code">{result.friendCode}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {addFriendMessage && (
                            <p style={{color: addFriendMessage.includes('éxito') ? '#22c55e' : '#ef4444', marginBottom: '15px'}}>
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
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage}>Enviar</button>
                    </div>
                </div>
            )}
        </>
    );
}