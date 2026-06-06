import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Store from './Pages/Store';
import Lobby from './Pages/Lobby';
import OAuth2RedirectHandler from './Pages/OAuth2RedirectHandler';
import NotFound from './Pages/errorsPages/NotFound';

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