import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Components/Navbar';
import './Styles/App.css';

const App = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <Navbar />

            <main className="hero-section">
                <div className="hero-content">
                    <img src="/logo.png" alt="Main Logo" className="main-logo" />
                    <h1 className="hero-subtitle">UN UNIVERSO DE ESTRATEGIA Y COMBATE</h1>
                    <button className="play-free-btn" onClick={() => navigate('/register')}>JUGAR GRATIS</button>
                </div>
            </main>
        </div>
    );
};

export default App;