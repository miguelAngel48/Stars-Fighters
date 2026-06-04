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
    const [isUploading, setIsUploading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const [newCosmeticName, setNewCosmeticName] = useState("");
    const [newCosmeticPrice, setNewCosmeticPrice] = useState(0);
    const [newCosmeticImage, setNewCosmeticImage] = useState(null);
    
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
        } catch (error) {
        }
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
                    avatar: profileData.avatarUrl || "http://localhost:8080/uploads/cosmetics/default-avatar.png",
                    role: profileData.role
                });
            })
            .catch(() => {
                setUser({
                    username: decoded.sub || "Usuario",
                    level: decoded.level,
                    avatar: "http://localhost:8080/uploads/cosmetics/default-avatar.png",
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
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Error al comprar");
            setTimeout(() => setMessage(""), 3000);
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
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Error al equipar");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewCosmeticImage(e.target.files[0]);
        }
    };

    const handleCreateCosmetic = async (e) => {
        e.preventDefault();
        
        if (!newCosmeticImage) {
            setMessage("Por favor, selecciona una imagen");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append("name", newCosmeticName);
        formData.append("price", newCosmeticPrice);
        formData.append("image", newCosmeticImage);

        try {
            const response = await fetch("http://localhost:8080/api/store/admin/items", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData 
            });
            
            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || "Creado correctamente");
                setNewCosmeticName("");
                setNewCosmeticPrice(0);
                setNewCosmeticImage(null);
                setIsCreateModalOpen(false);
                fetchData();
            } else {
                const errorData = await response.text();
                setMessage(errorData || "Error al crear");
            }
        } catch (error) {
            setMessage("Error de conexión");
        } finally {
            setIsUploading(false);
            setTimeout(() => setMessage(""), 3000);
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
                    <div className="store-header-container">
                        <h1 className="store-title">Tienda de Cosméticos</h1>
                        {user.role === "ADMIN" && (
                            <button className="btn-create-cosmetic" onClick={() => setIsCreateModalOpen(true)}>
                                Crear Cosmético
                            </button>
                        )}
                    </div>

                    {message && <div className="store-alert">{message}</div>}

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

            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Añadir Producto</h3>
                        <p>Sube una imagen JPG o PNG para el nuevo cosmético.</p>

                        <form onSubmit={handleCreateCosmetic} className="modal-form-grid">
                            <input
                                type="text"
                                placeholder="Nombre del avatar"
                                className="modal-input"
                                value={newCosmeticName}
                                onChange={(e) => setNewCosmeticName(e.target.value)}
                                required
                                disabled={isUploading}
                            />
                            <input
                                type="number"
                                placeholder="Precio"
                                className="modal-input"
                                value={newCosmeticPrice}
                                onChange={(e) => setNewCosmeticPrice(parseInt(e.target.value) || 0)}
                                required
                                disabled={isUploading}
                            />
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="modal-input"
                                onChange={handleFileChange}
                                required
                                disabled={isUploading}
                            />
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel" 
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    disabled={isUploading}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-add" disabled={isUploading}>
                                    {isUploading ? "Subiendo..." : "Añadir"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}