import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/Dashboard.css"; 

export default function FriendProfile() {
    const location = useLocation();
    const navigate = useNavigate();
    const friend = location.state?.friend;

    if (!friend) {
        return (
            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--color-danger)' }}>Usuario no encontrado</h2>
                <button className="btn-cancel" style={{ marginTop: '20px' }} onClick={() => navigate(-1)}>Volver</button>
            </div>
        );
    }

    const handleRemoveFriend = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:8080/api/friendships/${friend.friendshipId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (response.ok) {
                navigate("/dashboard");
            }
        } catch (error) {}
    };

    return (
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="user-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', height: 'fit-content' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                    <img 
                        src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} 
                        alt="Avatar" 
                        style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} 
                    />
                    <div 
                        className={`status-dot ${friend.currentStatus || 'OFFLINE'}`} 
                        style={{ width: '25px', height: '25px', bottom: '10px', right: '10px', border: '4px solid var(--bg-panel)' }}
                    ></div>
                </div>
                
                <h2 style={{ margin: '0 0 10px 0', color: 'var(--color-accent)' }}>{friend.username}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '16px' }}>Código: {friend.friendCode}</p>
                
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