import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useNotification } from "../contexts/NotificationContext";
import "../Styles/PlayMenu.css";

export default function PlayMenu() {
    const { user } = useUser();
    const { latestEvent } = useNotification();
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);
    const ApiUrl = import.meta.VITE_API_URL

    useEffect(() => {
        if (!latestEvent) return;
        if (latestEvent.type === 'MATCH_FOUND_LEADER') {
            navigate(`/character-selection?lobbyId=${latestEvent.lobbyId}&role=leader&oppName=${latestEvent.senderName}`);
        } else if (latestEvent.type === 'MATCH_FOUND_GUEST') {
            navigate(`/character-selection?lobbyId=${latestEvent.lobbyId}&role=guest&oppName=${latestEvent.senderName}`);
        }
    }, [latestEvent, navigate]);

    const handlePlayCustom = () => {
        navigate("/lobby");
    };

    const handleSearchMatch = async () => {
        setIsSearching(true);
        const token = localStorage.getItem("token");
        try {
            await fetch(`${ApiUrl}/api/lobby/matchmaking/join`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) { }
    };

    const handleCancelSearch = async () => {
        setIsSearching(false);
        const token = localStorage.getItem("token");
        try {
            await fetch(`${ApiUrl}/api/lobby/matchmaking/leave`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) { }
    };

    if (!user) return null;

    return (
        <div className="playmenu-container">
            <h1 className="playmenu-title">Modo de Juego</h1>
            {!isSearching ? (
                <div className="modes-grid">
                    <div className="mode-card normal-card" onClick={handleSearchMatch}>
                        <h2 className="mode-name normal-title">Partida Normal</h2>
                        <p className="mode-description">Encuentra un oponente aleatorio en línea. Modo clasificatorio de 3 minutos y 5 vidas con obtención de recompensas.</p>
                    </div>
                    <div className="mode-card custom-card" onClick={handlePlayCustom}>
                        <h2 className="mode-name custom-title">Partida Personalizada</h2>
                        <p className="mode-description">Crea una sala privada, configura las reglas a tu gusto e invita a tus amigos a entrenar o combatir.</p>
                    </div>
                </div>
            ) : (
                <div className="searching-panel">
                    <h2 className="searching-title">Buscando Oponente...</h2>
                    <div className="loading-spinner"></div>
                    <button className="btn-cancel-search" onClick={handleCancelSearch}>Cancelar Búsqueda</button>
                </div>
            )}
        </div>
    );
}