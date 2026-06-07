import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();

    return (
        <div style={{ padding: '40px' }}>
            <h1 style={{ color: 'var(--color-accent)', marginBottom: '30px', textTransform: 'uppercase' }}>Comunidad y Estadísticas</h1>
            
            {user ? (
                <div className="user-card">
                    <h3>Tu Perfil</h3>
                    <p><strong>Usuario:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </div>
            ) : (
                <div className="user-card" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Únete a la Comunidad</h3>
                    <p style={{ marginBottom: '20px' }}>Regístrate para ver tus estadísticas, agregar amigos y chatear.</p>
                    <button className="btn-add" onClick={() => navigate('/register')}>Crear Cuenta</button>
                </div>
            )}

            <div className="general-stats-placeholder" style={{ marginTop: '40px' }}>
                <h2 style={{ color: 'var(--color-accent)' }}>Tablas Generales (Top Jugadores)</h2>
                <div className="user-card" style={{ marginTop: '20px' }}>
                    <p>Próximamente: Ranking global de jugadores, mejores clanes y estadísticas de la temporada actual.</p>
                </div>
            </div>
        </div>
    );
}