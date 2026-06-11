import React, { useEffect, useState } from 'react';
import '../Styles/Champions.css';

const Champions = () => {
    const [champions, setChampions] = useState([]);
    const ApiUrl = import.meta.env.VITE_API_URL
    useEffect(() => {
        fetch(`${ApiUrl}/api/characters`)
            .then(res => res.json())
            .then(data => setChampions(data))
            .catch(err => console.error("Error fetching champions:", err));
    }, []);

    return (
        <div className="champions-container">
            <div className="champions-header">
                <h1 className="champions-title">Campeones y Lore</h1>
                <p className="champions-subtitle">Descubre a los héroes que lucharán en este universo cósmico.</p>
            </div>

            <div className="champions-grid">
                {champions.map(champ => (
                    <div key={champ.id} className="champion-card">
                        <div className="champion-avatar-wrapper">
                            <img
                                src={champ.spriteProfileUrl}
                                alt={champ.name}
                                className="champion-avatar"
                            />
                        </div>
                        <h2 className="champion-name">{champ.name}</h2>
                        <p className="champion-description">{champ.description}</p>

                        <div className="champion-stats">
                            <div className="stat-item">
                                <span className="stat-label">Salud</span>
                                <span className="stat-value">{champ.maxHp}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Daño Base</span>
                                <span className="stat-value">{champ.baseDamage}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Velocidad</span>
                                <span className="stat-value">{champ.speed}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Salto</span>
                                <span className="stat-value">{champ.jumpForce}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Champions;