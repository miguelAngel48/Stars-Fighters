import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import "../Styles/Lobby.css";

export default function Lobby() {
    const { user } = useUser();
    const { latestEvent } = useNotification();
    const [friends, setFriends] = useState([]);
    const [player2, setPlayer2] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const lobbyIdUrl = searchParams.get("lobbyId");
    const leaderNameUrl = searchParams.get("leaderName");

    const [currentLobbyId, setCurrentLobbyId] = useState(lobbyIdUrl || null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchFriends(token);

        if (role === "guest" && leaderNameUrl) {
            setPlayer2({ username: user?.username, status: 'joined', avatarUrl: user?.avatarUrl || user?.avatar });
        }
    }, [navigate, role, user, leaderNameUrl]);

    useEffect(() => {
        if (!latestEvent) return;

        if (latestEvent.type === 'GAME_ACCEPTED') {
            setPlayer2({ username: latestEvent.senderName, status: 'joined', avatarUrl: latestEvent.avatarUrl });
        }
        else if (latestEvent.type === 'GAME_REJECTED') {
            setPlayer2(null);
        }
        else if (latestEvent.type === 'LOBBY_CLOSED') {
            navigate("/dashboard");
        }
        else if (latestEvent.type === 'GUEST_LEFT') {
            setPlayer2(null);
        }
        else if (latestEvent.type === 'GUEST_KICKED') {
            navigate("/dashboard");
        }
    }, [latestEvent, navigate]);

    const handleStartGame = async () => {
        if (!player2 || !currentLobbyId) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/lobby/start?guestUsername=${player2.username}&lobbyId=${currentLobbyId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                navigate(`/character-selection?lobbyId=${currentLobbyId}&role=leader&oppName=${player2.username}`);
            }
        } catch (err) { }
    };

    const handleKickPlayer = async () => {
        if (!player2 || !currentLobbyId) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/lobby/kick?guestUsername=${player2.username}&lobbyId=${currentLobbyId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setPlayer2(null);
            }
        } catch (err) { }
    };

    const fetchFriends = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/friendships", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
            }
        } catch (error) { }
    };

    const handleDragStart = (e, friend) => {
        if (role === "guest") return;
        e.dataTransfer.setData("friendData", JSON.stringify(friend));
    };

    const handleLeaveLobby = async () => {
        const token = localStorage.getItem("token");

        let targetUsername = null;
        if (role === "guest") {
            targetUsername = leaderNameUrl;
        } else if (player2) {
            targetUsername = player2.username;
        }

        if (targetUsername && currentLobbyId) {
            try {
                fetch(`http://localhost:8080/api/lobby/leave?targetUsername=${targetUsername}&lobbyId=${currentLobbyId}&isLeader=${role !== "guest"}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (e) { }
        }

        navigate("/dashboard");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (role === "guest" || player2) return;
        setIsDraggingOver(true);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (role === "guest" || player2) return;

        const friendDataString = e.dataTransfer.getData("friendData");
        if (friendDataString) {
            const friendDropped = JSON.parse(friendDataString);

            setPlayer2({ username: friendDropped.username, status: 'inviting', avatarUrl: friendDropped.avatarUrl });

            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`http://localhost:8080/api/lobby/invite/${friendDropped.id}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentLobbyId(data.lobbyId);
                } else {
                    setPlayer2(null);
                }
            } catch (err) {
                setPlayer2(null);
            }
        }
    };

    if (!user) return <div className="loading">Entrando al Lobby...</div>;

    return (
        <div className="lobby-container" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button 
                    onClick={handleLeaveLobby} 
                    style={{ background: 'transparent', color: 'var(--color-danger)', fontSize: '16px', fontWeight: 'bold' }}
                >
                    Abandonar Sala
                </button>
                <h2 style={{ margin: 0, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    {role === 'guest' ? `SALA DE ${leaderNameUrl}` : "TU SALA DE ESPERA"}
                </h2>
                <div style={{ width: '120px' }}></div>
            </div>

            <div className="lobby-body" style={{ flex: 1 }}>
                <main className="lobby-main">
                    <div className="game-table">
                        <div className="player-slot leader-slot">
                            <div className="crown-icon">👑</div>
                            <img
                                src={role === 'guest' ? (friends.find(f => f.username === leaderNameUrl)?.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png") : (user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png")}
                                alt="Líder"
                                className="slot-avatar"
                            />
                            <h3>{role === 'guest' ? leaderNameUrl : user.username}</h3>
                            <span className="slot-status ready">Líder</span>
                        </div>

                        <div className="vs-badge">VS</div>

                        <div
                            className={`player-slot empty-slot ${isDraggingOver ? 'drag-over' : ''} ${player2 ? 'filled' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={() => setIsDraggingOver(false)}
                            onDrop={handleDrop}
                        >
                            {!player2 ? (
                                <div className="empty-content">
                                    <span className="plus-icon">+</span>
                                    <p>Arrastra un amigo aquí<br />para invitarlo</p>
                                </div>
                            ) : (
                                <div className="filled-content">
                                    {role !== 'guest' && (
                                        <button className="kick-btn" onClick={handleKickPlayer} title="Expulsar jugador">✖</button>
                                    )}
                                    <img
                                        src={role === 'guest' ? (user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png") : (player2?.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png")}
                                        alt="Jugador 2"
                                        className="slot-avatar"
                                    />
                                    <h3>{player2.username}</h3>
                                    <span className={`slot-status ${player2.status}`}>
                                        {player2.status === 'inviting' ? 'Esperando respuesta...' : '¡Listo para pelear!'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lobby-actions">
                        {role !== 'guest' ? (
                            <button className="btn-start-game" disabled={!player2 || player2.status !== 'joined'} onClick={handleStartGame}>
                                INICIAR PARTIDA
                            </button>
                        ) : (
                            <p style={{ color: '#888', fontStyle: 'italic', marginTop: '20px' }}>
                                Esperando a que el líder inicie la batalla...
                            </p>
                        )}
                    </div>
                </main>

                <aside className="lobby-sidebar">
                    <h3 className="sidebar-title">{role === 'guest' ? "Espectadores" : "Invitar Amigos"}</h3>
                    <ul className="friends-drag-list">
                        {role === 'guest' ? (
                            <li className="no-friends" style={{ color: '#666' }}>No hay nadie más mirando.</li>
                        ) : friends.length === 0 ? (
                            <li className="no-friends">No tienes amigos conectados.</li>
                        ) : (
                            friends.map((friend) => (
                                <li
                                    key={friend.id}
                                    className="friend-drag-item"
                                    draggable={!player2}
                                    onDragStart={(e) => handleDragStart(e, friend)}
                                    style={{ opacity: player2 ? 0.5 : 1, cursor: player2 ? 'not-allowed' : 'grab' }}
                                >
                                    <div className="drag-handle">⠿</div>
                                    <img src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Avatar" className="tiny-avatar" />
                                    <span>{friend.username}</span>
                                </li>
                            ))
                        )}
                    </ul>
                    {role !== 'guest' && <p className="drag-hint">Arrastra un amigo al cuadro del centro</p>}
                </aside>
            </div>
        </div>
    );
}