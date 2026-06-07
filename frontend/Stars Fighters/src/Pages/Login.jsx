import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import googleIcon from '../assets/google.svg';
import "../Styles/Auth.css";

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
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                window.location.href = "/dashboard";
            } else {
                const errorMessage = await response.text();
                setError(errorMessage || "Email o contraseña incorrectos");
            }
        } catch (err) {
            setError("Error de conexión");
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    };

    return (
        <div className="auth-screen">
            <div className="auth-box">
                <h1>Iniciar Sesión</h1>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit} className="login-form">
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

                    <button type="submit" className="btn-submit">Entrar</button>

                    <div className="divider">O</div>

                    <button type="button" onClick={handleGoogleLogin} className="btn-google">
                        <img src={googleIcon} alt="Logo de Google" className="google-icon" />
                        Continuar con Google
                    </button>
                </form>

                <Link to="/register" className="register-link">
                    ¿No tienes cuenta? Regístrate
                </Link>
            </div>
        </div>
    );
}