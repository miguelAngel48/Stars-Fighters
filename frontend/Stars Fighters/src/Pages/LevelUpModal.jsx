
import React from 'react';
import '../Styles/LevelUpModal.css';

export default function LevelUpModal({ newLevel, onClose }) {
    return (
        <div className="level-up-modal-overlay">
            <div className="level-up-modal-content">
                <h1 className="level-up-title">
                    ¡NIVEL AUMENTADO!
                </h1>

                <p className="level-up-subtitle">Has alcanzado el...</p>

                <div className="level-up-number">
                    {newLevel}
                </div>

                <button className="level-up-btn" onClick={onClose}>
                    ¡Genial!
                </button>
            </div>
        </div>
    );
}