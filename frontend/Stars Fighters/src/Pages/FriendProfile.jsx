import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import "../Styles/Dashboard.css"; 

export default function FriendProfile() {
    const location = useLocation();
    const navigate = useNavigate();
    const friend = location.state?.friend;

    if (!friend) {
        return (
            <div className="dashboard-container">
                <Navbar centerContent={<button className="play-btn" onClick={() => navigate("/Lobby")}>Jugar</button>} />
                <div className="dashboard-body" style={{justifyContent: 'center', alignItems: 'center'}}>
                    <h2>Usuario no encontrado</h2>
                    <button className="nav-btn" onClick={() => navigate(-1)}>Volver</button>
                </div>
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
        <div className="dashboard-container">
            <Navbar 
                leftContent={
                    <>
                        <button className="nav-btn" onClick={() => navigate("/dashboard")}>Dashboard</button>
                        <button className="nav-btn" onClick={() => navigate("/store")}>Tienda</button>
                    </>
                }
                centerContent={<button className="play-btn" onClick={() => navigate("/Lobby")}>Jugar</button>}
            />
            
            <div className="dashboard-body" style={{ justifyContent: 'center', padding: '40px' }}>
                <div className="user-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', margin: '0 auto', height: 'fit-content' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                        <img 
                            src={friend.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png"} 
                            alt="Avatar" 
                            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <div 
                            className={`status-dot ${friend.currentStatus || 'OFFLINE'}`} 
                            style={{ width: '25px', height: '25px', bottom: '10px', right: '10px', border: '4px solid white' }}
                        ></div>
                    </div>
                    
                    <h2 style={{ margin: '0 0 10px 0' }}>{friend.username}</h2>
                    <p style={{ color: '#666', marginBottom: '30px', fontSize: '18px' }}>Código de amigo: {friend.friendCode}</p>
                    
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="nav-btn" onClick={() => navigate(-1)}>Volver</button>
                        <button className="btn-logout" onClick={handleRemoveFriend}>Cancelar amistad</button>
                    </div>
                </div>
            </div>
        </div>
    );
}