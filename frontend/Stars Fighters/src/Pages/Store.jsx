import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import "../Styles/Store.css";

export default function Store() {
    const { user, refreshUser } = useUser();
    const [storeItems, setStoreItems] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState("");
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const fetchData = async () => {
        try {
            const headers = token ? { "Authorization": `Bearer ${token}` } : {};
            const resItems = await fetch("http://localhost:8080/api/store/items", { headers });
            
            if (resItems.ok) {
                setStoreItems(await resItems.json());
            }

            if (token) {
                const resInv = await fetch("http://localhost:8080/api/store/inventory", { headers });
                if (resInv.ok) setInventory(await resInv.json());
            }
        } catch (error) {}
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
            const url = type === 'buy' ? `http://localhost:8080/api/store/buy/${id}` : `http://localhost:8080/api/store/equip/${id}`;
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

    const isOwned = (itemId) => inventory.some(item => item.id === itemId);

    return (
        <div className="store-page-container">
            <div className="store-content">
                <div className="store-header-container">
                    <div>
                        <h1 className="store-title">Tienda de Cosméticos</h1>
                        {user && <p className="store-coins">💰 Monedas disponibles: {user.coins}</p>}
                    </div>
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
        </div>
    );
}