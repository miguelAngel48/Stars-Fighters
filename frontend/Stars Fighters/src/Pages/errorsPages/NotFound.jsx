import React from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/NotFound.css";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="not-found-code">404</h1>
                <div className="not-found-icon">👾</div>
                <h2 className="not-found-title">Ooh... we didn't find anything here!</h2>
                <p className="not-found-text">
                    It seems you've wandered into an unexplored zone.
                    Do you want to come back to the main menu?
                </p>
                <button
                    className="not-found-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    GET BACK TO SAFETY
                </button>
            </div>
        </div>
    );
}