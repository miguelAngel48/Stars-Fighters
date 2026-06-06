import React from 'react';
import { Link } from 'react-router-dom';

function App() {
    return (
        <div className="auth-screen">
            <div className="auth-box main-menu">
                <h1 className="game-title">STARS FIGHTERS</h1>

                <div className="menu-options">
                    <Link to="/login" className="btn-submit">
                        Entrar al juego
                    </Link>

                    <Link to="/register" className="btn-secondary">
                        Crear cuenta
                    </Link>
                </div>

                <p className="footer-text">V. 1.0.0 - 2026</p>
            </div>
        </div>
    )
}

export default App;