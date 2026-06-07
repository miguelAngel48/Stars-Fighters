import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";

export default function PlayMenu() {
    const { user } = useUser();
    const { latestEvent } = useNotification();
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!latestEvent) return;
        if (latestEvent.type === 'MATCH_FOUND_LEADER') {
            navigate(`/character-selection?lobbyId=${latestEvent.lobbyId}&role=leader&oppName=${latestEvent.senderName}`);
        } else if (latestEvent.type === 'MATCH_FOUND_GUEST') {
            navigate(`/character-selection?lobbyId=${latestEvent.lobbyId}&role=guest&oppName=${latestEvent.senderName}`);
        }
    }, [latestEvent, navigate]);

    const handlePlayFriends = () => {
        navigate("/lobby");
    };

    const handleSearchMatch = async () => {
        setIsSearching(true);
        const token = localStorage.getItem("token");
        try {
            await fetch("http://localhost:8080/api/lobby/matchmaking/join", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) {}
    };

    const handleCancelSearch = async () => {
        setIsSearching(false);
        const token = localStorage.getItem("token");
        try {
            await fetch("http://localhost:8080/api/lobby/matchmaking/leave", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) {}
    };

    if (!user) return null;

    return (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <h1 style={{ color: 'var(--color-primary)', marginBottom: '40px', textTransform: 'uppercase' }}>Modo de Juego</h1>
            
            {!isSearching ? (
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div 
                        className="user-card" 
                        style={{ width: '300px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={handlePlayFriends}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <h2 style={{ color: 'var(--color-accent)' }}>Jugar con Amigos</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Crea una sala privada e invita a tus amigos a combatir.</p>
                    </div>

                    <div 
                        className="user-card" 
                        style={{ width: '300px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '2px solid var(--color-primary)' }}
                        onClick={handleSearchMatch}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <h2 style={{ color: 'var(--color-primary)' }}>Buscar Partida</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Encuentra un oponente aleatorio en línea.</p>
                    </div>
                </div>
            ) : (
                <div className="user-card" style={{ width: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <h2 style={{ color: 'var(--color-primary)' }}>Buscando Oponente...</h2>
                    <div style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <button className="btn-cancel" onClick={handleCancelSearch}>Cancelar Búsqueda</button>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}
        </div>
    );
}