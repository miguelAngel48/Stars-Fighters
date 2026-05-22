import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWebSocket } from "../contexts/WebSocketContext";
import "../Styles/Lobby.css";

const playerPlaceholder = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
const p1Avatar = "https://api.dicebear.com/7.x/shapes/svg?seed=Player1";
const p2Avatar = "https://api.dicebear.com/7.x/shapes/svg?seed=Player2";

export default function Lobby() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const role = searchParams.get("role"); 
    const lobbyId = searchParams.get("lobbyId");
    const leaderId = searchParams.get("leaderId");
    const leaderName = searchParams.get("leaderName");
    const token = localStorage.getItem("token");

    const { clientRef } = useWebSocket();

    const initialPlayer1 = role === "guest" ? { username: leaderName, avatar: p1Avatar } : { username: "Tú", avatar: p1Avatar };
    const initialPlayer2 = role === "guest" ? { username: "Tú", avatar: p2Avatar } : null;

    const [player1, setPlayer1] = useState(initialPlayer1);
    const [player2, setPlayer2] = useState(initialPlayer2);
    const [isP1Ready, setIsP1Ready] = useState(false);
    const [isP2Ready, setIsP2Ready] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [searchCode, setSearchCode] = useState("");
    const [filteredFriends, setFilteredFriends] = useState([]);

    const fetchFriends = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/friendships", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFriends(data);
                setFilteredFriends(data);
            }
        } catch (error) { console.error("Error fetching friends"); }
    };

    const handleSearch = (e) => {
        const val = e.target.value.trim().toLowerCase();
        setSearchCode(val);
        setFilteredFriends(
            friends.filter(f =>
                f.username.toLowerCase().includes(val) ||
                f.friendCode.toLowerCase().includes(val)
            )
        );
    };

    const handleInvite = (friendId, friendUsername) => {
        if (!clientRef.current || !clientRef.current.connected) return;

        const invitePayload = {
            senderId: leaderId,
            senderName: leaderName,
            lobbyId: lobbyId,
            receiverId: friendId
        };

        clientRef.current.publish({
            destination: `/app/lobby.invite/${friendUsername}`,
            body: JSON.stringify(invitePayload)
        });

        alert(`¡Invitación enviada a ${friendUsername}!`);
        setIsModalOpen(false);
    };

    return (
        <div className="lobby-container">
            <header className="lobby-header">
                <button className="back-btn" onClick={() => navigate("/dashboard")}>← Salir</button>
                <h1>Lobby Pública #{lobbyId ? lobbyId.substring(0, 4) : "????"}</h1>
            </header>

            <div className="lobby-content">
                <div className="players-slots">
                    <div className={`player-slot slot-blue ${isP1Ready ? 'ready' : ''}`}>
                        <img src={player1?.avatar || playerPlaceholder} alt="P1" className="player-avatar" />
                        <h3>{player1?.username || "Esperando..."}</h3>
                        {role !== "guest" && (
                            <button className="ready-btn" onClick={() => setIsP1Ready(!isP1Ready)}>
                                {isP1Ready ? "¡Listo!" : "No Listo"}
                            </button>
                        )}
                    </div>

                    <div className={`player-slot slot-red ${isP2Ready ? 'ready' : ''}`}>
                        <img src={player2?.avatar || playerPlaceholder} alt="P2" className="player-avatar" />
                        {player2 ? (
                            <h3>{player2.username}</h3>
                        ) : (
                            role !== "guest" && (
                                <button className="invite-placeholder-btn" onClick={() => { setIsModalOpen(true); fetchFriends(); }}>
                                    + Invitar
                                </button>
                            )
                        )}
                        {player2 && role === "guest" && (
                            <button className="ready-btn" onClick={() => setIsP2Ready(!isP2Ready)}>
                                {isP2Ready ? "¡Listo!" : "No Listo"}
                            </button>
                        )}
                    </div>
                </div>

                {role !== "guest" && (
                    <div className="start-button-area">
                        <button className="play-btn" disabled={!(isP1Ready && isP2Ready)}>
                            INICIAR PARTIDA
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Invitar Amistades</h3>
                        <input type="text" value={searchCode} onChange={handleSearch} placeholder="Código #1234-5678 o nombre..." className="modal-input" />
                        <ul className="invite-friends-list">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map(f => (
                                    <li key={f.id}>
                                        <span>{f.username} ({f.friendCode})</span>
                                        <button onClick={() => handleInvite(f.id, f.username)}>Invitar</button>
                                    </li>
                                ))
                            ) : <li>No se encontraron amistades.</li>}
                        </ul>
                        <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}