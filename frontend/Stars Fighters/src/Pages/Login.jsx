import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include"
            });
            if (response.ok) {
                navigate("/dashboard");
            } else {
                setError("Email o contraseña incorrectos");
            }
        } catch (err) {
            setError("Error de conexión");
        }
    };

    return (
        <div>
            <h1>Iniciar Sesión</h1>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} required />
                <button type="submit">Entrar</button>
            </form>
            <Link to="/register">¿No tienes cuenta? Regístrate</Link>
        </div>
    );
}