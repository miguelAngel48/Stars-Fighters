import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../Styles/Store.css";
import "../Styles/Dashboard.css";

export default function Store() {
    const [storeItems, setStoreItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState("");
    const [user, setUser] = useState(null);
    const [newCosmetic, setNewCosmetic] = useState({ name: "", price: 0, imageUrl: "" });
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const fetchData = async () => {
        try {
            const resItems = await fetch("http://localhost:8080/api/store/items", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const resInv = await fetch("http://localhost:8080/api/store/inventory", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (resItems.ok && resInv.ok) {
                setStoreItems(await resItems.json());
                setInventory(await resInv.json());
            }
        } catch (error) {}
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const decoded = jwtDecode(token);
            if (decoded.exp < Date.now() / 1000) {
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }

            fetch("http://localhost:8080/api/auth/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(profileData => {
                setUser({
                    username: profileData.username,
                    level: profileData.level,
                    avatar: profileData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.username}`,
                    role: profileData.role
                });
            })
            .catch(() => {
                setUser({
                    username: decoded.sub || "Usuario",
                    level: decoded.level,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.sub}`,
                    role: decoded.role || "USER"
                });
            });

            fetchData();
        } catch (error) {
            localStorage.removeItem("token");
            navigate("/login");
        }
    }, [navigate, token]);

    const handleBuy = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/store/buy/${id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setMessage(data.message || response.statusText);
            fetchData();
        } catch (error) {
            setMessage("Error al comprar");
        }
    };

    const handleEquip = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/store/equip/${id}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setMessage(data.message || response.statusText);
            fetchData();
        } catch (error) {
            setMessage("Error al equipar");
        }
    };

    const handleCreateCosmetic = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8080/api/store/admin/items", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newCosmetic)
            });
            const data = await response.json();
            setMessage(data.message || "Error al crear");
            if (response.ok) {
                setNewCosmetic({ name: "", price: 0, imageUrl: "" });
                fetchData();
            }
        } catch (error) {
            setMessage("Error de conexión");
        }
    };

    const isOwned = (itemId) => inventory.some(item => item.id === itemId);

    if (!user) return <div className="loading">Cargando tienda...</div>;

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <div className="nav-left">
                    <button className="nav-btn" onClick={() => navigate("/dashboard")}>Dashboard</button>
                    <button className="nav-btn" onClick={() => navigate("/store")}>Tienda</button>
                </div>
                <div className="nav-center">
                    <button className="play-btn" onClick={() => navigate("/Lobby")}>Jugar</button>
                </div>
                <div className="nav-right">
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        <img src={user.avatar} alt="Perfil" className="profile-img" />
                        <div className="profile-info">
                            <span className="profile-name">{user.username}</span>
                            <span className="profile-level">Nvl. {user.level}</span>
                        </div>
                    </button>
                </div>
            </nav>

            <div className="store-scroll-area">
                <div className="store-content">
                    <h1 className="store-title">Tienda de Cosméticos</h1>

                    {message && <div className="store-alert">{message}</div>}

                    {user.role === "ADMIN" && (
                        <div className="admin-panel">
                            <h3>Panel de Administración</h3>
                            <form className="admin-form" onSubmit={handleCreateCosmetic}>
                                <input
                                    type="text"
                                    placeholder="Nombre del avatar"
                                    className="admin-input"
                                    value={newCosmetic.name}
                                    onChange={(e) => setNewCosmetic({ ...newCosmetic, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Precio"
                                    className="admin-input"
                                    value={newCosmetic.price}
                                    onChange={(e) => setNewCosmetic({ ...newCosmetic, price: parseInt(e.target.value) || 0 })}
                                    required
                                />
                                <input
                                    type="url"
                                    placeholder="URL de la imagen"
                                    className="admin-input"
                                    value={newCosmetic.imageUrl}
                                    onChange={(e) => setNewCosmetic({ ...newCosmetic, imageUrl: e.target.value })}
                                    required
                                />
                                <button type="submit" className="btn-create">Añadir Producto</button>
                            </form>
                        </div>
                    )}

                    <div className="store-grid">
                        {storeItems.map((item) => (
                            <div key={item.id} className="store-card">
                                <img src={item.imageUrl} alt={item.name} className="store-item-img" />
                                <h3>{item.name}</h3>
                                <p className="store-item-price">{item.price} Monedas</p>
                                
                                {isOwned(item.id) ? (
                                    <button className="btn-equip" onClick={() => handleEquip(item.id)}>
                                        Equipar
                                    </button>
                                ) : (
                                    <button className="btn-buy" onClick={() => handleBuy(item.id)}>
                                        Comprar
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}