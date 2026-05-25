import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import "../Styles/Lobby.css";

export default function Lobby() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [player2, setPlayer2] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Herramienta para leer los datos de la URL (?role=guest&lobbyId=...)
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const lobbyIdUrl = searchParams.get("lobbyId");
    const leaderNameUrl = searchParams.get("leaderName");
    const leaderIdUrl = searchParams.get("leaderId");

    const [currentLobbyId, setCurrentLobbyId] = useState(lobbyIdUrl || null);

    const navigate = useNavigate();
    const stompClientRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const myUser = {
                id: decoded.id,
                username: decoded.sub || "Jugador",
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.sub}`
            };
            setUser(myUser);


            if (role === "guest") {
                setPlayer2({ username: myUser.username, status: 'joined' });
            }

            fetchFriends(token);
            connectLobbyWebSocket(token);

        } catch (error) {
            navigate("/login");
        }

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [navigate, role]);

    const connectLobbyWebSocket = (token) => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-stars'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log('STOMP Conectado en el Lobby');

                client.subscribe('/user/queue/notifications', (message) => {
                    if (message.body) {
                        const notification = JSON.parse(message.body);

                        if (notification.type === 'GAME_ACCEPTED') {
                            setPlayer2({ username: notification.senderName, status: 'joined' });
                        }
                        else if (notification.type === 'GAME_REJECTED') {
                            alert(`${notification.senderName} ha rechazado tu invitación.`);
                            setPlayer2(null);
                        }
                        else if (notification.type === 'LOBBY_CLOSED') {
                            alert(`El líder ${notification.senderName} ha cerrado la sala.`);
                            navigate("/dashboard");
                        }
                        else if (notification.type === 'GUEST_LEFT') {
                            alert(`${notification.senderName} ha abandonado la sala.`);
                            setPlayer2(null);
                        }
                        else if (notification.type === 'GUEST_KICKED') {
                            alert("Has sido expulsado de la sala por el líder.");
                            navigate("/dashboard");
                        }
                        else if (notification.type === 'START_SELECTION') {
                            navigate(`/character-selection?lobbyId=${notification.lobbyId}&role=guest&oppName=${leaderNameUrl}`);
                        }
                    }
                });
            }
        });
        client.activate();
        stompClientRef.current = client;
    };

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
        } catch (err) {
            console.error(err);
        }
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
        } catch (err) {
            console.error("Error al conectar con el servidor para expulsar:", err);
        }
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
        } catch (error) {
            console.error("Error al cargar amigos:", error);
        }
    };

    const handleDragStart = (e, friend) => {
        if (role === "guest") return; // El invitado no puede invitar a otros
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
            } catch (e) {
                console.error("No se pudo notificar la salida");
            }
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

            setPlayer2({ username: friendDropped.username, status: 'inviting' });


            const token = localStorage.getItem("token");
            try {
                const response = await fetch(`http://localhost:8080/api/lobby/invite/${friendDropped.id}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentLobbyId(data.lobbyId);
                    console.log("Invitación enviada con éxito, sala:", data.lobbyId);
                } else {
                    setPlayer2(null);
                }
            } catch (err) {
                console.error("Error al conectar con el servidor para invitar:", err);
                setPlayer2(null);
            }
        }
    };

    if (!user) return <div className="loading">Entrando al Lobby...</div>;

    return (
        <div className="lobby-container">
            <nav className="navbar">
                <div className="nav-left">
                    <button className="nav-btn" onClick={handleLeaveLobby}>Salir al Menu</button>
                </div>
                <div className="nav-center">
                    <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>
                        {role === 'guest' ? `SALA DE ${leaderNameUrl.toUpperCase()}` : "TU SALA DE ESPERA"}
                    </h2>
                </div>
                <div className="nav-right">
                    <div className="profile-btn">
                        <img src={user.avatar} alt="Perfil" className="profile-img" />
                        <span className="profile-name">{user.username}</span>
                    </div>
                </div>
            </nav>

            <div className="lobby-body">
                <main className="lobby-main">
                    <div className="game-table">


                        <div className="player-slot leader-slot">
                            <div className="crown-icon">👑</div>
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role === 'guest' ? leaderNameUrl : user.username}`}
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
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player2.username}`}
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
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} alt="Avatar" className="tiny-avatar" />
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