import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import "../Styles/CharacterSelection.css";

export default function CharacterSelection() {
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isMyReady, setIsMyReady] = useState(false);
    const [isOpponentReady, setIsOpponentReady] = useState(false);
    const [opponentCharName, setOpponentCharName] = useState("");

    const [searchParams] = useSearchParams();
    const lobbyId = searchParams.get("lobbyId");
    const role = searchParams.get("role"); // "leader" o "guest"

    const navigate = useNavigate();
    const stompClientRef = useRef(null);
    const [opponentUsername, setOpponentUsername] = useState("");


    const [maps, setMaps] = useState([]);
    const [selectedMap, setSelectedMap] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        fetchCharacters(token);
        fetchOpponentInfo(token);
        connectSelectionWebSocket(token);
        fetchMaps(token);

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [navigate, lobbyId]);

    const fetchMaps = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/maps", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMaps(data);

                if (data.length > 0) {
                    setSelectedMap(data[0].id);
                }
            }
        } catch (error) {
            console.error("Error al cargar mapas", error);
        }
    };
    const fetchCharacters = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/characters", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCharacters(data);
            }
        } catch (error) { console.error("Error al cargar personajes", error); }
        finally { setIsLoading(false); }
    };

    // Averiguamos el nombre del oponente buscando en la sala del lobby
    const fetchOpponentInfo = async (token) => {
        // En un entorno ideal, pasarías el nombre del oponente por la URL igual que el leaderName.
        // Para simplificar, asumimos que recuperamos los datos del oponente guardados.
        // Añadiremos un buscador básico o reutilizaremos las variables.
        try {
            const response = await fetch(`http://localhost:8080/api/lobby/info?lobbyId=${lobbyId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // data.opponent contiene el nombre del otro
                setOpponentUsername(role === 'leader' ? data.guestName : data.leaderName);
            }
        } catch (e) {
            // Fallback por si la ruta no existe todavía: lo sacamos de una variable global o localStorage alternativa
            const savedOpponent = localStorage.getItem("last_opponent_username");
            setOpponentUsername(savedOpponent || "Oponente");
        }
    };

    const connectSelectionWebSocket = (token) => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-stars'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe('/user/queue/notifications', (message) => {
                    if (message.body) {
                        const data = JSON.parse(message.body);

                        if (data.type === "OPPONENT_READY") {
                            setIsOpponentReady(true);
                            setOpponentCharName(data.characterName);
                        }
                        else if (data.type === "START_GAME") {
                            const myId = role === "leader" ? data.leaderCharId : data.guestCharId;
                            const oppId = role === "leader" ? data.guestCharId : data.leaderCharId;
                            navigate(`/game?lobbyId=${lobbyId}&mapId=${data.mapId}&myCharId=${myId}&oppCharId=${oppId}`);
                        }
                    }
                });
            }
        });
        client.activate();
        stompClientRef.current = client;
    };

    const handleConfirm = async () => {
        if (!selectedChar || isMyReady) return;

        const token = localStorage.getItem("token");

        let url = `http://localhost:8080/api/lobby/ready?lobbyId=${lobbyId}&role=${role}&characterId=${selectedChar.id}&characterName=${selectedChar.name}&targetUsername=${opponentUsername}`;

        if (role === "leader") {
            url += `&mapId=${selectedMap}`;
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                setIsMyReady(true);
            }
        } catch (err) {
            console.error("Error al enviar preparación:", err);
        }
    };

    if (isLoading) return <div className="loading">Cargando la arena de selección...</div>;

    return (
        <div className="char-select-container">
            <h1 className="select-title">PANTALLA DE SELECCIÓN</h1>

            <div className="readiness-banner">
                <div className={`status-badge ${isMyReady ? 'ready' : 'waiting'}`}>
                    {isMyReady ? "✓ ¡ESTÁS LISTO!" : "SELECCIONA TU CONFIGURACIÓN..."}
                </div>
                <div className={`status-badge ${isOpponentReady ? 'ready' : 'waiting'}`}>
                    {isOpponentReady ? `✓ ${opponentUsername} ELIGIÓ A ${opponentCharName.toUpperCase()}` : `ESPERANDO A ${opponentUsername.toUpperCase()}...`}
                </div>
            </div>

            <div className="char-select-layout">
                <div className="char-grid">
                    {characters.map((char) => (
                        <div
                            key={char.id}
                            className={`char-card ${selectedChar?.id === char.id ? 'selected' : ''} ${isMyReady ? 'disabled' : ''}`}
                            onClick={() => !isMyReady && setSelectedChar(char)}
                        >
                            <img src={char.spriteIdleUrl} alt={char.name} className="char-portrait" />
                            <div className="char-name-badge">{char.name}</div>
                        </div>
                    ))}
                </div>

                <div className="char-details-panel">
                    {selectedChar ? (
                        <>
                            <h2>{selectedChar.name}</h2>
                            <div className="stats-container">
                                <div className="stat-row">
                                    <span>HP Máximo:</span>
                                    <div className="stat-bar"><div className="stat-fill hp" style={{ width: `${(selectedChar.maxHp / 150) * 100}%` }}></div></div>
                                </div>
                                <div className="stat-row">
                                    <span>Fuerza de Ataque:</span>
                                    <div className="stat-bar"><div className="stat-fill" style={{ width: `${(selectedChar.baseDamage / 30) * 100}%`, background: '#f44336' }}></div></div>
                                </div>
                                <div className="stat-row">
                                    <span>Velocidad:</span>
                                    <div className="stat-bar"><div className="stat-fill speed" style={{ width: `${(selectedChar.speed / 10) * 100}%` }}></div></div>
                                </div>
                                <div className="stat-row">
                                    <span>Salto (Fuerza Vertical):</span>
                                    <div className="stat-bar"><div className="stat-fill" style={{ width: `${(selectedChar.jumpForce / 20) * 100}%`, background: '#FFC107' }}></div></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-details">
                            <p>Selecciona un guerrero para ver sus atributos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- SECCIÓN 2: MAPAS (Solo Líder) --- */}
            <div className="map-selection-wrapper">
                {role === "leader" ? (
                    <>
                        <h2 className="section-subtitle">ELIGE EL CAMPO DE BATALLA</h2>
                        <div className="map-grid">
                            {maps.map((map) => (
                                <div
                                    key={map.id}
                                    className={`map-card ${selectedMap === map.id ? 'selected' : ''} ${isMyReady ? 'disabled' : ''}`}
                                    onClick={() => !isMyReady && setSelectedMap(map.id)}
                                >
                                    <img src={map.backgroundUrl} alt={map.name} className="map-thumbnail" />
                                    <div className="map-info">
                                        <h4>{map.name}</h4>
                                        <p>{map.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="guest-map-hint">
                        <h2 className="section-subtitle">CAMPO DE BATALLA</h2>
                        <p>El líder de la sala está eligiendo el escenario...</p>
                    </div>
                )}
            </div>

            <button
                className="btn-confirm-char"
                onClick={handleConfirm}
                disabled={isMyReady || !selectedChar}
                style={{ backgroundColor: (isMyReady || !selectedChar) ? '#555' : 'var(--color-primary)' }}
            >
                {isMyReady ? "ESPERANDO AL OTRO..." : "¡FIJAR CONFIGURACIÓN!"}
            </button>

        </div>
    );
}