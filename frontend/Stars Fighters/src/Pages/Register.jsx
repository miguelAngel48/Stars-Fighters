import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/Auth.css";

export default function Register() {
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setSuccess(data.message);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                const data = await response.json();
                setError(data.message || "Error al registrar");
            }
        } catch (err) {
            setError("Error de conexión");
        }
    };

    return (
        <div className="auth-screen">
            <div className="auth-box">
                <h1>Registro</h1>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <form onSubmit={handleSubmit} className="login-form">
                    <input 
                        type="text" 
                        name="username" 
                        placeholder="Usuario" 
                        value={formData.username} 
                        onChange={handleChange} 
                        className="login-input"
                        required 
                    />
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="login-input"
                        required 
                    />
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Contraseña" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className="login-input"
                        required 
                    />
                    <button type="submit" className="btn-submit">Crear cuenta</button>
                </form>

                <Link to="/login" className="register-link">
                    ¿Ya tienes una cuenta? Inicia sesión
                </Link>
            </div>
        </div>
    );
}