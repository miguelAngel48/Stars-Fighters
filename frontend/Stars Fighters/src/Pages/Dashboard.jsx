import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const ApiUrl = import.meta.env.VITE_API_URL
    useEffect(() => {
        const fetchLeaderboard = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`${ApiUrl}/api/stats/leaderboard`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data);
                }
            } catch (err) {
                console.error("Error fetching leaderboard", err);
            }
        };
        fetchLeaderboard();
    }, []);

    const totalGames = user ? (user.wins + user.losses) : 0;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

    return (
        <div style={{ padding: '40px' }}>
            <h1 style={{ color: 'var(--color-accent)', marginBottom: '30px', textTransform: 'uppercase' }}>Comunidad y Estadísticas</h1>

            {user ? (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="user-card" style={{ flex: '1', minWidth: '300px' }}>
                        <h3>Tu Perfil</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <img src={user.avatarUrl || user.equippedAvatarUrl} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                            <div>
                                <p style={{ fontSize: '1.2em', margin: 0 }}><strong>{user.username}</strong></p>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nivel {user.level}</p>
                            </div>
                        </div>
                    </div>

                    <div className="user-card" style={{ flex: '2', minWidth: '300px' }}>
                        <h3>Mis Estadísticas</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '15px' }}>
                            <div>
                                <h4 style={{ color: 'var(--color-primary)', fontSize: '2em', margin: 0 }}>{user.wins}</h4>
                                <p>Victorias</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--color-danger)', fontSize: '2em', margin: 0 }}>{user.losses}</h4>
                                <p>Derrotas</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--color-accent)', fontSize: '2em', margin: 0 }}>{winRate}%</h4>
                                <p>Win Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="user-card" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Únete a la Comunidad</h3>
                    <p style={{ marginBottom: '20px' }}>Regístrate para ver tus estadísticas, agregar amigos y chatear.</p>
                    <button className="btn-add" onClick={() => navigate('/register')}>Crear Cuenta</button>
                </div>
            )}

            <div className="general-stats-placeholder" style={{ marginTop: '40px' }}>
                <h2 style={{ color: 'var(--color-accent)' }}>Ranking Global (Top Victorias)</h2>
                <div className="user-card" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
                    {leaderboard.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '15px' }}>#</th>
                                    <th style={{ padding: '15px' }}>Jugador</th>
                                    <th style={{ padding: '15px' }}>Nivel</th>
                                    <th style={{ padding: '15px' }}>Victorias</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold', color: index < 3 ? 'var(--color-primary)' : 'inherit' }}>{index + 1}</td>
                                        <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img src={player.avatarUrl || `${ApiUrl}/uploads/cosmetics/default-avatar.png`} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                            {player.username}
                                        </td>
                                        <td style={{ padding: '15px' }}>{player.level}</td>
                                        <td style={{ padding: '15px', color: 'var(--color-primary)', fontWeight: 'bold' }}>{player.wins}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ padding: '20px' }}>Cargando ranking...</p>
                    )}
                </div>
            </div>
        </div>
    );
}