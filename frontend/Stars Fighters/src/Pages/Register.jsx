import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Styles/registre.css";
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
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const responseText = await response.text();
                setSuccess(responseText);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                const errorText = await response.text();
                setError(errorText || "Error al registrar");
            }
        } catch (err) {
            setError("Error de conexión");
        }
    };

    return (
        <div>
            <h1>Registro</h1>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Usuario" value={formData.username} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleChange} required />
                <button type="submit">Crear cuenta</button>
            </form>
            <Link to="/login">¿Ya tienes una cuenta? Inicia sesión</Link>
        </div>
    );
}