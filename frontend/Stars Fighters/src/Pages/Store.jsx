import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import monedasIcon from "../assets/monedas.png";
import "../Styles/Store.css";

export default function Store() {
    const { user, refreshUser } = useUser();
    const [storeItems, setStoreItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState("");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", price: 0, type: "AVATAR", image: null });
    const ApiUrl = import.meta.VITE_API_URL
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchData = async () => {
        try {
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};
            const resItems = await fetch(`${ApiUrl}/api/store/items`, { headers });

            if (resItems.ok) {
                setStoreItems(await resItems.json());
            }

            if (token) {
                const resInv = await fetch(`${ApiUrl}/api/store/inventory`, { headers });
                if (resInv.ok) setInventory(await resInv.json());
            }
        } catch (error) { }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleAction = async (id, type) => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        try {
            const url = type === 'buy' ? `${ApiUrl}/api/store/buy/${id}` : `${ApiUrl}/api/store/equip/${id}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || (type === 'buy' ? "Comprado con éxito" : "Equipado con éxito"));
                fetchData();
                if (refreshUser) refreshUser();
            } else {
                const errorData = await response.text();
                setMessage(errorData || "Error en la operación");
            }
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Error de conexión");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();

        if (!newItem.name || !newItem.image) {
            setMessage("Nombre e imagen son obligatorios");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        const formData = new FormData();
        formData.append("name", newItem.name);
        formData.append("price", newItem.price);
        formData.append("type", newItem.type);
        formData.append("image", newItem.image);

        try {
            const response = await fetch(`${ApiUrl}/api/store/admin/items`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setMessage("Cosmético añadido con éxito");
                setIsAdminModalOpen(false);
                setNewItem({ name: "", price: 0, type: "AVATAR", image: null });
                fetchData();
            } else {
                const errorData = await response.text();
                setMessage(errorData || "Error al añadir el producto");
            }
        } catch (error) {
            setMessage("Error de conexión al servidor");
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const isOwned = (itemId) => inventory.some(item => item.id === itemId);

    return (
        <div className="store-page-container">
            <div className="store-content">
                <div className="store-header-card">
                    <div className="store-header-info">
                        <h1 className="store-title">Tienda de Cosméticos</h1>
                        {user && (
                            <div className="store-coins">
                                <img src={monedasIcon} alt="Monedas" className="coin-icon" />
                                <span>Monedas disponibles: {user.coins}</span>
                            </div>
                        )}
                    </div>

                    {user && user.role === 'ADMIN' && (
                        <button
                            className="btn-add-admin"
                            onClick={() => setIsAdminModalOpen(true)}
                        >
                            + Añadir Cosmético
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
                                <button className="btn-equip" onClick={() => handleAction(item.id, 'equip')}>
                                    Equipar
                                </button>
                            ) : (
                                <button className="btn-buy" onClick={() => handleAction(item.id, 'buy')}>
                                    Comprar
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {isAuthModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--color-accent)' }}>Requiere Autenticación</h3>
                        <p>Inicia sesión o regístrate para poder adquirir cosméticos exclusivos.</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                            <button className="btn-cancel" onClick={() => setIsAuthModalOpen(false)}>Cerrar</button>
                            <button className="btn-add" onClick={() => navigate('/login')}>Iniciar Sesión</button>
                        </div>
                    </div>
                </div>
            )}

            {isAdminModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: 'var(--color-accent)', marginBottom: '15px' }}>Añadir Nuevo Cosmético</h3>

                        <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Precio (Monedas):</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Tipo:</label>
                                <select
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-main)', color: 'white', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                >
                                    <option value="AVATAR">Avatar</option>
                                    <option value="BANNER">Banner</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Imagen (.png, .jpg):</label>
                                <input
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    required
                                    onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })}
                                    style={{ width: '100%', color: 'white' }}
                                />
                            </div>

                            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button type="button" className="btn-cancel" onClick={() => setIsAdminModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-add">Crear Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}