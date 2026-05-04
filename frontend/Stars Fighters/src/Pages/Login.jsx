import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import googleIcon from '../assets/google.svg';
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
                navigate("/dashboard");
            } else {

                const errorMessage = await response.text();
                setError(errorMessage || "Email o contraseña incorrectos");
            }
        } catch (err) {
            console.log(err)
            setError("Error de conexión");
        }
    };
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    };

    return (
        <div>
            <h1>Iniciar Sesión</h1>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">Entrar</button>
                <div className="divider">O</div>

                <button onClick={handleGoogleLogin} className="btn-google">
                    <img src={googleIcon} alt="Logo de Google" className="google-icon" />
                    Continuar con Google
                </button>
            </form>
            <Link to="/register">¿No tienes cuenta? Regístrate</Link>
        </div>
    );
}