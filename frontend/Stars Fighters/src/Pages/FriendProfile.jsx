import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/Dashboard.css";

export default function FriendProfile() {
    const location = useLocation();
    const navigate = useNavigate();
    const friend = location.state?.friend;
    const ApiUrl = import.env.VITE_API_URL
    if (!friend) {
        return (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--color-danger)' }}>Usuario no encontrado</h2>
                <button className="btn-cancel" style={{ marginTop: '20px' }} onClick={() => navigate(-1)}>Volver</button>
            </div>
        );
    }

    const totalGames = friend.wins + friend.losses;
    const winRate = totalGames > 0 ? Math.round((friend.wins / totalGames) * 100) : 0;

    const handleRemoveFriend = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`${ApiUrl}/api/friendships/${friend.friendshipId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                navigate("/dashboard");
            }
        } catch (error) { }
    };

    return (
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="user-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', height: 'fit-content' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                    <img
                        src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"}
                        alt="Avatar"
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }}
                    />
                    <div
                        className={`status-dot ${friend.currentStatus || 'OFFLINE'}`}
                        style={{ width: '20px', height: '20px', bottom: '10px', right: '10px', border: '3px solid var(--bg-panel)' }}
                    ></div>
                </div>

                <h2 style={{ margin: '0', color: 'var(--color-accent)' }}>{friend.username}</h2>
                <p style={{ margin: '5px 0 0 0', color: 'var(--color-primary)', fontWeight: 'bold' }}>Nivel {friend.level}</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>Código: {friend.friendCode}</p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '30px'
                }}>
                    <div>
                        <h4 style={{ color: 'var(--color-primary)', fontSize: '1.5em', margin: 0 }}>{friend.wins}</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>Victorias</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-danger)', fontSize: '1.5em', margin: 0 }}>{friend.losses}</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>Derrotas</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--color-accent)', fontSize: '1.5em', margin: 0 }}>{winRate}%</h4>
                        <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-muted)' }}>Win Rate</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        className="btn-add"
                        onClick={() => navigate("/lobby")}
                    >
                        Invitar a Jugar
                    </button>
                    <button
                        className="btn-logout"
                        style={{ width: '100%' }}
                        onClick={handleRemoveFriend}
                    >
                        Cancelar amistad
                    </button>
                    <button
                        className="btn-cancel"
                        onClick={() => navigate(-1)}
                    >
                        Volver
                    </button>
                </div>
            </div>
        </div>
    );
}