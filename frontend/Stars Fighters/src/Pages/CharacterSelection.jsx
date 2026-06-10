import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { useNotification } from "../contexts/NotificationContext";
import "../Styles/CharacterSelection.css";

export default function CharacterSelection() {
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [maps, setMaps] = useState([]);
    const [selectedMap, setSelectedMap] = useState("");

    const [isMyReady, setIsMyReady] = useState(false);
    const [isOpponentReady, setIsOpponentReady] = useState(false);
    const [opponentCharName, setOpponentCharName] = useState("");

    const [searchParams] = useSearchParams();
    const lobbyId = searchParams.get("lobbyId");
    const role = searchParams.get("role");
    const oppNameUrl = searchParams.get("oppName");

    const navigate = useNavigate();
    const stompClientRef = useRef(null);
    const isStartingGameRef = useRef(false);
    const hasNavigatedAwayRef = useRef(false);

    const [opponentUsername, setOpponentUsername] = useState(oppNameUrl || "Oponente");
    const { latestEvent } = useNotification();

    useEffect(() => {
        if (!latestEvent) return;
        if (latestEvent.type === 'LOBBY_CLOSED' || latestEvent.type === 'GUEST_LEFT' || latestEvent.type === 'GUEST_KICKED') {
            hasNavigatedAwayRef.current = true;
            navigate("/dashboard");
        }
    }, [latestEvent, navigate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        fetchCharacters(token);
        fetchMaps(token);
        connectSelectionWebSocket(token);

        return () => {
            if (stompClientRef.current) {
                if (stompClientRef.current.connected && !isStartingGameRef.current && !hasNavigatedAwayRef.current) {
                    stompClientRef.current.publish({
                        destination: "/app/game.leave",
                        body: JSON.stringify({ targetUsername: opponentUsername })
                    });
                }
                stompClientRef.current.deactivate();
            }
        };
    }, [navigate, lobbyId, opponentUsername]);

    const fetchCharacters = async (token) => {
        try {
            const response = await fetch("http://localhost:8080/api/characters", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCharacters(data);
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

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
                            isStartingGameRef.current = true;
                            navigate(`/game?lobbyId=${lobbyId}&mapId=${data.mapId}&myCharId=${myId}&oppCharId=${oppId}&oppName=${opponentUsername}`);
                        }
                    }
                });

                client.subscribe('/user/queue/game-opponent-left', () => {
                    hasNavigatedAwayRef.current = true;
                    navigate("/dashboard");
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
        }
    };

    const handleManualLeave = () => {
        hasNavigatedAwayRef.current = false;
        navigate("/dashboard");
    };

    if (isLoading) return <div className="cs-loading-text">Cargando la arena de selección...</div>;

    return (
        <div className="cs-container">
            <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                <button 
                    onClick={handleManualLeave} 
                    style={{ background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Abandonar
                </button>
            </div>

            <h1 className="cs-main-title">Pantalla de Selección</h1>

            <div className="cs-status-banner">
                <div className={`cs-status-badge ${isMyReady ? 'cs-badge-ready' : 'cs-badge-waiting'}`}>
                    {isMyReady ? "✓ ¡ESTÁS LISTO!" : "SELECCIONE SU GUERRERO..."}
                </div>
                <div className={`cs-status-badge ${isOpponentReady ? 'cs-badge-ready' : 'cs-badge-waiting'}`}>
                    {isOpponentReady ? `✓ ${opponentUsername} ELIGIÓ A ${opponentCharName.toUpperCase()}` : `ESPERANDO A ${opponentUsername.toUpperCase()}...`}
                </div>
            </div>

            <div className="cs-content-layout">
                <div className="cs-grid-panel">
                    {characters.map((char) => (
                        <div
                            key={char.id}
                            className={`cs-char-card ${selectedChar?.id === char.id ? 'cs-card-active' : ''} ${isMyReady ? 'cs-card-disabled' : ''}`}
                            onClick={() => !isMyReady && setSelectedChar(char)}
                        >
                            <img src={char.spriteProfileUrl} alt={char.name} className="cs-portrait-img" />
                            <div className="cs-name-tag">{char.name}</div>
                        </div>
                    ))}
                </div>

                <div className="cs-details-side">
                    {selectedChar ? (
                        <div className="cs-details-box">
                            <h2 className="cs-details-name">{selectedChar.name}</h2>
                            <div className="cs-details-content-row">
                                <div className="cs-preview-window">
                                    <img src={selectedChar.spriteProfileUrl} alt={selectedChar.name} className="cs-large-img" />
                                </div>
                                <div className="cs-stats-list">
                                    <div className="cs-stat-item">
                                        <span className="cs-stat-label">HP Máximo (Fijo):</span>
                                        <div className="cs-bar-bg"><div className="cs-bar-fill cs-hp-color" style={{ width: '100%' }}></div></div>
                                    </div>
                                    <div className="cs-stat-item">
                                        <span className="cs-stat-label">Fuerza de Ataque (Fija):</span>
                                        <div className="cs-bar-bg"><div className="cs-bar-fill cs-dmg-color" style={{ width: '33%' }}></div></div>
                                    </div>
                                    <div className="cs-stat-item">
                                        <span className="cs-stat-label">Velocidad:</span>
                                        <div className="cs-bar-bg"><div className="cs-bar-fill cs-spd-color" style={{ width: `${(selectedChar.speed / 10) * 100}%` }}></div></div>
                                    </div>
                                    <div className="cs-stat-item">
                                        <span className="cs-stat-label">Fuerza de Salto:</span>
                                        <div className="cs-bar-bg"><div className="cs-bar-fill cs-jmp-color" style={{ width: `${(selectedChar.jumpForce / 20) * 100}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="cs-empty-selection">
                            <p>Selecciona un Star Warrior para ver sus atributos en detalle.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="cs-map-section">
                {role === "leader" ? (
                    <>
                        <h2 className="cs-map-title">Elige el Campo de Batalla</h2>
                        <div className="cs-map-grid">
                            {maps.map((map) => (
                                <div
                                    key={map.id}
                                    className={`cs-map-card ${selectedMap === map.id ? 'cs-map-active' : ''} ${isMyReady ? 'cs-map-disabled' : ''}`}
                                    onClick={() => !isMyReady && setSelectedMap(map.id)}
                                >
                                    <img src={map.backgroundUrl} alt={map.name} className="cs-map-bg-img" />
                                    <div className="cs-map-overlay">
                                        <h4 className="cs-map-name">{map.name}</h4>
                                        <p className="cs-map-desc">{map.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="cs-guest-map-info">
                        <h2 className="cs-map-title">Campo de Batalla</h2>
                        <p>El líder de la sala está seleccionando el escenario idóneo...</p>
                    </div>
                )}
            </div>

            <button
                className={`cs-btn-submit ${isMyReady || !selectedChar ? 'cs-btn-locked' : ''}`}
                onClick={handleConfirm}
                disabled={isMyReady || !selectedChar}
            >
                {isMyReady ? "Esperando respuesta del rival..." : "¡Confirmar Selección!"}
            </button>
        </div>
    );
}