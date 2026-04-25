import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });


    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const navigate = useNavigate();


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {

            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {

                const responseText = await response.text();
                setSuccess(responseText);


                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {

                const errorText = await response.text();
                setError(errorText || "Error al registrar el usuario.");
            }
        } catch (err) {

            setError("Error de conexión con el servidor.");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
            <h1>Registro</h1>


            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                    <label>Usuario:</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <div>
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <button type="submit" style={{ padding: "10px", backgroundColor: "#007BFF", color: "white", border: "none", cursor: "pointer" }}>
                    Crear cuenta
                </button>
            </form>

            <p style={{ marginTop: "15px" }}>
                ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
        </div>
    );
}