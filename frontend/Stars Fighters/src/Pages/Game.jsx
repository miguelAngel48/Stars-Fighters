import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import "../Styles/Game.css";

export default function Game() {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const keys = useRef({});
    const stompClientRef = useRef(null);

    const [searchParams] = useSearchParams();
    const lobbyId = searchParams.get("lobbyId");
    const mapId = searchParams.get("mapId");
    const myCharId = searchParams.get("myCharId");
    const oppCharId = searchParams.get("oppCharId");
    const oppName = searchParams.get("oppName");
    const navigate = useNavigate();

    const [gameState, setGameState] = useState("LOADING");
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(180);
    const [gameAssets, setGameAssets] = useState(null);

    const myPositionRef = useRef({ x: 0, y: 100 });
    const oppPositionRef = useRef({ x: 0, y: 100 });

    const animations = {
        IDLE: { row: 0, frames: 4 },
        RUN: { row: 1, frames: 8 },
        JUMP: { row: 2, frames: 2 },
        ATTACK: { row: 3, frames: 4 }
    };

    useEffect(() => {
        if (!lobbyId || !mapId || !myCharId || !oppCharId || !oppName) {
            navigate("/dashboard");
            return;
        }

        const token = localStorage.getItem("token");

        const loadAssets = async () => {
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

                    myPositionRef.current.x = window.innerWidth * 0.3;
                    oppPositionRef.current.x = window.innerWidth * 0.7 - 80;

                    setGameAssets({ myChar, oppChar, currentMap });
                    setGameState("STARTING");
                }
            } catch (error) {
                navigate("/dashboard");
            }
        };

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-stars'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                client.subscribe('/user/queue/game-sync', (msg) => {
                    const data = JSON.parse(msg.body);
                    oppPositionRef.current.x = data.x;
                    oppPositionRef.current.y = data.y;
                });
            }
        });

        client.activate();
        stompClientRef.current = client;

        loadAssets();

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [lobbyId, mapId, myCharId, oppCharId, oppName, navigate]);

    useEffect(() => {
        const handleKeyDown = (e) => { keys.current[e.code] = true; };
        const handleKeyUp = (e) => { keys.current[e.code] = false; };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

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

            const syncInterval = setInterval(() => {
                if (stompClientRef.current && stompClientRef.current.connected) {
                    stompClientRef.current.publish({
                        destination: "/app/game.sync",
                        body: JSON.stringify({
                            lobbyId: lobbyId,
                            targetUsername: oppName,
                            x: myPositionRef.current.x,
                            y: myPositionRef.current.y
                        })
                    });
                }
            }, 1000 / 30);

            return () => {
                clearInterval(matchTimer);
                clearInterval(syncInterval);
            };
        }
    }, [gameState, timeLeft, lobbyId, oppName]);

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
        myImage.src = gameAssets.myChar.spriteMovesUrl;

        const oppImage = new Image();
        oppImage.src = gameAssets.oppChar.spriteMovesUrl;

        const bgImage = new Image();
        bgImage.src = gameAssets.currentMap.backgroundUrl;

        const myPlayer = {
            id: "p1",
            width: 80,
            height: 100,
            spriteWidth: 128,
            spriteHeight: 128,
            velocityY: 0,
            speed: gameAssets.myChar.speed,
            jumpForce: gameAssets.myChar.jumpForce,
            isGrounded: false,
            image: myImage,
            frameX: 0,
            frameY: 0,
            maxFrames: 4,
            fps: 10,
            frameTimer: 0,
            action: "IDLE",
            direction: 1
        };

        const opponent = {
            id: "p2",
            width: 80,
            height: 100,
            spriteWidth: 128,
            spriteHeight: 128,
            image: oppImage,
            frameX: 0,
            frameY: 0,
            maxFrames: 4,
            fps: 10,
            frameTimer: 0,
            action: "IDLE",
            direction: -1
        };

        const gravity = gameAssets.currentMap.gravity;
        let lastTime = 0;

        const gameLoop = (timestamp) => {
            requestRef.current = requestAnimationFrame(gameLoop);

            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (bgImage.complete && bgImage.naturalWidth > 0) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }

            const platformWidth = canvas.width * 0.6;
            const platformHeight = 40;
            const platformX = (canvas.width - platformWidth) / 2;
            const platformY = canvas.height * 0.7;

            ctx.fillStyle = "#2a2d35";
            ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

            if (gameState === "PLAYING") {
                let isMoving = false;

                if (keys.current["ArrowLeft"] || keys.current["KeyA"]) {
                    myPositionRef.current.x -= myPlayer.speed;
                    myPlayer.direction = -1;
                    isMoving = true;
                }
                if (keys.current["ArrowRight"] || keys.current["KeyD"]) {
                    myPositionRef.current.x += myPlayer.speed;
                    myPlayer.direction = 1;
                    isMoving = true;
                }
                if ((keys.current["ArrowUp"] || keys.current["KeyW"] || keys.current["Space"]) && myPlayer.isGrounded) {
                    myPlayer.velocityY = -myPlayer.jumpForce;
                    myPlayer.isGrounded = false;
                }

                if (!myPlayer.isGrounded) {
                    myPlayer.action = "JUMP";
                } else if (isMoving) {
                    myPlayer.action = "RUN";
                } else {
                    myPlayer.action = "IDLE";
                }
            }

            if (gameState === "STARTING" || gameState === "PLAYING") {
                myPlayer.velocityY += gravity;
                myPositionRef.current.y += myPlayer.velocityY;

                const isAbovePlatform = myPositionRef.current.x + myPlayer.width > platformX && myPositionRef.current.x < platformX + platformWidth;
                const isFallingOnPlatform = myPositionRef.current.y + myPlayer.height >= platformY && myPositionRef.current.y + myPlayer.height - myPlayer.velocityY <= platformY;

                if (isAbovePlatform && isFallingOnPlatform) {
                    myPositionRef.current.y = platformY - myPlayer.height;
                    myPlayer.velocityY = 0;
                    myPlayer.isGrounded = true;
                } else {
                    myPlayer.isGrounded = false;
                }
            }

            const updateAnimation = (player) => {
                const anim = animations[player.action];
                player.frameY = anim.row;
                player.maxFrames = anim.frames;

                if (player.frameTimer > 1000 / player.fps) {
                    player.frameX = (player.frameX + 1) % player.maxFrames;
                    player.frameTimer = 0;
                } else {
                    player.frameTimer += deltaTime;
                }
            };

            const drawPlayer = (player, x, y, label) => {
                updateAnimation(player);

                ctx.save();

                if (player.direction === -1) {
                    ctx.translate(x + player.width, y);
                    ctx.scale(-1, 1);
                    x = 0;
                    y = 0;
                }

                if (player.image.complete && player.image.naturalWidth > 0) {
                    ctx.drawImage(
                        player.image,
                        player.frameX * player.spriteWidth,
                        player.frameY * player.spriteHeight,
                        player.spriteWidth,
                        player.spriteHeight,
                        x,
                        y,
                        player.width,
                        player.height
                    );
                } else {
                    ctx.fillStyle = player.id === "p1" ? "#4CAF50" : "#f44336";
                    ctx.fillRect(x, y, player.width, player.height);
                }

                ctx.restore();

                ctx.fillStyle = "white";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(label, player.direction === -1 ? myPositionRef.current.x + player.width / 2 : x + player.width / 2, player.direction === -1 ? myPositionRef.current.y - 10 : y - 10);
            };

            drawPlayer(myPlayer, myPositionRef.current.x, myPositionRef.current.y, "Tú");

            opponent.action = "IDLE";
            drawPlayer(opponent, oppPositionRef.current.x, oppPositionRef.current.y, oppName);
        };

        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, gameAssets, oppName]);

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