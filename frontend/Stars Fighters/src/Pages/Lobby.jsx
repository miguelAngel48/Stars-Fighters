import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import coronaIcon from '../assets/corona.png';
import "../Styles/Lobby.css";

export default function Lobby() {
    const { user } = useUser();
    const { latestEvent } = useNotification();
    const [friends, setFriends] = useState([]);
    const [player2, setPlayer2] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [timeLimit, setTimeLimit] = useState(180);
    const [lives, setLives] = useState(5);

    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const lobbyIdUrl = searchParams.get("lobbyId");
    const leaderNameUrl = searchParams.get("leaderName");
    const ApiUrl = import.env.VITE_API_URL
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
            fetchSettings(lobbyIdUrl);
        }
    }, [navigate, role, user, leaderNameUrl, lobbyIdUrl]);

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

    const fetchSettings = async (id) => {
        try {
            const response = await fetch(`${ApiUrl}/api/lobby/settings/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTimeLimit(data.timeLimit);
                setLives(data.lives);
            }
        } catch (err) { }
    };

    const handleStartGame = async () => {
        if (!player2 || !currentLobbyId) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/lobby/start?guestUsername=${player2.username}&lobbyId=${currentLobbyId}`, {
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
            const response = await fetch(`${ApiUrl}/api/lobby/kick?guestUsername=${player2.username}&lobbyId=${currentLobbyId}`, {
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
            const response = await fetch(`${ApiUrl}/api/friendships`, {
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
                fetch(`${ApiUrl}/api/lobby/leave?targetUsername=${targetUsername}&lobbyId=${currentLobbyId}&isLeader=${role !== "guest"}`, {
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
                const response = await fetch(`${ApiUrl}/api/lobby/invite/${friendDropped.id}`, {
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

    const handleSettingsChange = async (newTime, newLives) => {
        setTimeLimit(newTime);
        setLives(newLives);
        if (currentLobbyId) {
            const token = localStorage.getItem("token");
            try {
                await fetch(`${ApiUrl}/api/lobby/settings?lobbyId=${currentLobbyId}&timeLimit=${newTime}&lives=${newLives}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (err) { }
        }
    };

    if (!user) return <div className="loading-screen">Entrando al Lobby...</div>;

    return (
        <div className="lobby-wrapper">
            <div className="lobby-top-bar">
                <button onClick={handleLeaveLobby} className="lobby-btn-leave">
                    Abandonar Sala
                </button>
                <h2 className="lobby-title">
                    {role === 'guest' ? `SALA DE ${leaderNameUrl}` : "SALA PERSONALIZADA"}
                </h2>
                <div className="lobby-top-spacer"></div>
            </div>

            <div className="lobby-main-body">
                <div className="lobby-game-section">
                    <div className="lobby-table">
                        <div className="lobby-slot slot-leader">
                            <div className="slot-crown">
                                <img src={coronaIcon} alt="Corona" className="crown-img" />
                            </div>
                            <img
                                src={role === 'guest' ? (friends.find(f => f.username === leaderNameUrl)?.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png") : (user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png")}
                                alt="Líder"
                                className="slot-portrait"
                            />
                            <h3 className="slot-username">{role === 'guest' ? leaderNameUrl : user.username}</h3>
                            <span className="slot-badge badge-leader">Líder</span>
                        </div>

                        <div className="lobby-vs">VS</div>

                        <div
                            className={`lobby-slot slot-opponent ${isDraggingOver ? 'drag-active' : ''} ${player2 ? 'slot-filled' : 'slot-empty'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={() => setIsDraggingOver(false)}
                            onDrop={handleDrop}
                        >
                            {!player2 ? (
                                <div className="slot-empty-msg">
                                    <span className="slot-plus-icon">+</span>
                                    <p>Arrastra un amigo aquí para invitarlo</p>
                                </div>
                            ) : (
                                <div className="slot-filled-content">
                                    {role !== 'guest' && (
                                        <button className="slot-kick-btn" onClick={handleKickPlayer}>✖</button>
                                    )}
                                    <img
                                        src={role === 'guest' ? (user.avatar || user.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png") : (player2?.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png")}
                                        alt="Jugador 2"
                                        className="slot-portrait"
                                    />
                                    <h3 className="slot-username">{player2.username}</h3>
                                    <span className={`slot-badge badge-${player2.status}`}>
                                        {player2.status === 'inviting' ? 'Esperando...' : '¡Listo!'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lobby-config-panel">
                        <h3 className="config-title">Configuración de la Partida</h3>
                        <div className="config-row">
                            <label className="config-label">Tiempo de Juego:</label>
                            <select
                                value={timeLimit}
                                disabled={role === 'guest'}
                                onChange={(e) => handleSettingsChange(Number(e.target.value), lives)}
                                className="config-select"
                            >
                                <option value={60}>1 Minuto</option>
                                <option value={120}>2 Minutos</option>
                                <option value={180}>3 Minutos</option>
                                <option value={0}>Infinito</option>
                            </select>
                        </div>
                        <div className="config-row">
                            <label className="config-label">Vidas Máximas:</label>
                            <select
                                value={lives}
                                disabled={role === 'guest'}
                                onChange={(e) => handleSettingsChange(timeLimit, Number(e.target.value))}
                                className="config-select"
                            >
                                <option value={1}>1 Vida</option>
                                <option value={3}>3 Vidas</option>
                                <option value={5}>5 Vidas</option>
                                <option value={0}>Infinitas</option>
                            </select>
                        </div>
                    </div>

                    <div className="lobby-execution">
                        {role !== 'guest' ? (
                            <button className="lobby-btn-start" disabled={!player2 || player2.status !== 'joined'} onClick={handleStartGame}>
                                INICIAR PARTIDA
                            </button>
                        ) : (
                            <p className="lobby-waiting-text">
                                Esperando a que el líder inicie la batalla...
                            </p>
                        )}
                    </div>
                </div>

                {role !== 'guest' && (
                    <div className="lobby-sidebar-friends">
                        <h3 className="sidebar-friends-title">Invitar Amigos</h3>
                        <ul className="friends-drag-container">
                            {friends.length === 0 ? (
                                <li className="friends-empty-item">No tienes amigos conectados.</li>
                            ) : (
                                friends.map((friend) => (
                                    <li
                                        key={friend.id}
                                        className="friend-drag-card"
                                        draggable={!player2}
                                        onDragStart={(e) => handleDragStart(e, friend)}
                                        style={{ opacity: player2 ? 0.4 : 1, cursor: player2 ? 'not-allowed' : 'grab' }}
                                    >
                                        <div className="drag-icon-handle">⠿</div>
                                        <img src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} alt="Avatar" className="friend-drag-img" />
                                        <span className="friend-drag-name">{friend.username}</span>
                                    </li>
                                ))
                            )}
                        </ul>
                        <p className="drag-helper-text">Arrastra a un amigo al cuadro de la derecha</p>
                    </div>
                )}
            </div>
        </div>
    );
}