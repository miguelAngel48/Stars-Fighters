import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../Styles/Game.css";

export default function Game() {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    const [searchParams] = useSearchParams();
    const lobbyId = searchParams.get("lobbyId");
    const mapId = searchParams.get("mapId");
    const myCharId = searchParams.get("myCharId");
    const oppCharId = searchParams.get("oppCharId");
    const navigate = useNavigate();

    const [gameState, setGameState] = useState("LOADING");
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180);
    const [gameAssets, setGameAssets] = useState(null);

    useEffect(() => {
        if (!lobbyId || !mapId || !myCharId || !oppCharId) {
            navigate("/dashboard");
            return;
        }

        const loadAssets = async () => {
            const token = localStorage.getItem("token");
            try {
                const charsRes = await fetch("http://localhost:8080/api/characters", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const mapsRes = await fetch("http://localhost:8080/api/maps", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (charsRes.ok && mapsRes.ok) {
                    const chars = await charsRes.json();
                    const maps = await mapsRes.json();

                    const myChar = chars.find(c => c.id === Number(myCharId));
                    const oppChar = chars.find(c => c.id === Number(oppCharId));
                    const currentMap = maps.find(m => m.id === Number(mapId));

                    setGameAssets({ myChar, oppChar, currentMap });
                    setGameState("STARTING");
                }
            } catch (error) {
                navigate("/dashboard");
            }
        };

        loadAssets();
    }, [lobbyId, mapId, myCharId, oppCharId, navigate]);

    useEffect(() => {
        if (gameState !== "STARTING") return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev > 1) return prev - 1;
                if (prev === 1) return "FIGHT!";
                clearInterval(timer);
                setGameState("PLAYING");
                return null;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    useEffect(() => {
        if (gameState === "PLAYING" && timeLeft > 0) {
            const matchTimer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(matchTimer);
                        setGameState("ENDED");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(matchTimer);
        }
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState === "LOADING" || !gameAssets) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const myImage = new Image();
        myImage.src = gameAssets.myChar.spriteIdleUrl;

        const oppImage = new Image();
        oppImage.src = gameAssets.oppChar.spriteIdleUrl;

        const bgImage = new Image();
        bgImage.src = gameAssets.currentMap.backgroundUrl;

        const myPlayer = {
            id: "p1",
            x: canvas.width * 0.3,
            y: 100,
            width: 80,
            height: 100,
            velocityY: 0,
            speed: gameAssets.myChar.speed,
            jumpForce: gameAssets.myChar.jumpForce,
            image: myImage
        };

        const opponent = {
            id: "p2",
            x: canvas.width * 0.7 - 80,
            y: 100,
            width: 80,
            height: 100,
            velocityY: 0,
            speed: gameAssets.oppChar.speed,
            jumpForce: gameAssets.oppChar.jumpForce,
            image: oppImage
        };

        const gravity = gameAssets.currentMap.gravity;
        let lastTime = 0;

        const gameLoop = (timestamp) => {
            requestRef.current = requestAnimationFrame(gameLoop);

            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (bgImage.complete) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }

            const platformWidth = canvas.width * 0.6;
            const platformHeight = 40;
            const platformX = (canvas.width - platformWidth) / 2;
            const platformY = canvas.height * 0.7;

            ctx.fillStyle = "#2a2d35";
            ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

            const applyPhysics = (player) => {
                player.velocityY += gravity;
                player.y += player.velocityY;

                const isAbovePlatform = player.x + player.width > platformX && player.x < platformX + platformWidth;
                const isFallingOnPlatform = player.y + player.height >= platformY && player.y + player.height - player.velocityY <= platformY;

                if (isAbovePlatform && isFallingOnPlatform) {
                    player.y = platformY - player.height;
                    player.velocityY = 0;
                }
            };

            if (gameState === "STARTING" || gameState === "PLAYING") {
                applyPhysics(myPlayer);
                applyPhysics(opponent);
            }

            const drawPlayer = (player) => {
                if (player.image.complete) {
                    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
                } else {
                    ctx.fillStyle = player.id === "p1" ? "#4CAF50" : "#f44336";
                    ctx.fillRect(player.x, player.y, player.width, player.height);
                }

                ctx.fillStyle = "white";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(player.id === "p1" ? "Tú" : "Rival", player.x + player.width / 2, player.y - 10);
            };

            drawPlayer(myPlayer);
            drawPlayer(opponent);
        };

        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, gameAssets]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (gameState === "LOADING") {
        return <div className="game-wrapper"><div className="loading">Cargando la Arena...</div></div>;
    }

    return (
        <div className="game-wrapper">
            <canvas ref={canvasRef} className="game-canvas" />

            <div className="ui-layer">
                <div className="top-bar">
                    <div className="timer">{formatTime(timeLeft)}</div>
                </div>

                <div className="center-screen">
                    {countdown !== null && (
                        <div key={countdown} className={`countdown-text ${countdown === "FIGHT!" ? "countdown-fight" : ""}`}>
                            {countdown}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}