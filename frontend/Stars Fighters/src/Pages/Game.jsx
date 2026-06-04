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
    const [finalStats, setFinalStats] = useState(null);

    const myPositionRef = useRef({ x: 0, y: 100 });
    const oppPositionRef = useRef({ x: 0, y: 100 });

    const myHealthRef = useRef(100);
    const oppHealthRef = useRef(100);


    const myKillsRef = useRef(0);
    const oppKillsRef = useRef(0);

    const animations = {
        IDLE: { row: 0, startFrame: 1, totalFrames: 6 },
        RUN: { row: 2, startFrame: 1, totalFrames: 8 },
        JUMP: { row: 3, startFrame: 1, totalFrames: 8 },
        ATTACK: { row: 4, startFrame: 1, totalFrames: 6 }
    };


    const recordMatchInDatabase = async (isWinner) => {
        const token = localStorage.getItem("token");
        try {
            await fetch(`http://localhost:8080/api/stats/record?isWinner=${isWinner}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            console.log("Estadísticas guardadas en BD.");
        } catch (error) {
            console.error("No se pudo guardar la estadística", error);
        }
    };

    useEffect(() => {
        if (!lobbyId || !mapId || !myCharId || !oppCharId || !oppName) {
            navigate("/dashboard");
            return;
        }

        const token = localStorage.getItem("token");

        const loadGameData = async () => {
            try {
                const charsRes = await fetch("http://localhost:8080/api/characters", { headers: { "Authorization": `Bearer ${token}` } });
                const mapsRes = await fetch("http://localhost:8080/api/maps", { headers: { "Authorization": `Bearer ${token}` } });

                if (charsRes.ok && mapsRes.ok) {
                    const chars = await charsRes.json();
                    const maps = await mapsRes.json();

                    const myRawChar = chars.find(c => c.id === Number(myCharId));
                    const oppRawChar = chars.find(c => c.id === Number(oppCharId));
                    const rawMap = maps.find(m => m.id === Number(mapId));

                    const safeMyChar = {
                        ...myRawChar,
                        speed: Number(myRawChar.speed) || 5,
                        jumpForce: Number(myRawChar.jumpForce) || 15
                    };
                    const safeMap = {
                        ...rawMap,
                        gravity: Number(rawMap.gravity) || 0.6
                    };

                    myPositionRef.current.x = window.innerWidth * 0.3;
                    oppPositionRef.current.x = window.innerWidth * 0.7 - 80;

                    setGameAssets({ myChar: safeMyChar, oppChar: oppRawChar, currentMap: safeMap });

                    const savedStartTime = localStorage.getItem(`game_start_${lobbyId}`);
                    const now = Date.now();

                    if (!savedStartTime) {
                        localStorage.setItem(`game_start_${lobbyId}`, now.toString());
                        setCountdown(3);
                        setGameState("STARTING");
                    } else {
                        const elapsedSeconds = Math.floor((now - parseInt(savedStartTime)) / 1000);
                        if (elapsedSeconds >= 4) {
                            setCountdown(null);
                            setGameState("PLAYING");
                            setTimeLeft(Math.max(0, 180 - (elapsedSeconds - 4)));
                        } else {
                            setCountdown(3 - elapsedSeconds);
                            setGameState("STARTING");
                        }
                    }
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

                client.subscribe('/user/queue/game-hit', (msg) => {
                    const hitData = JSON.parse(msg.body);
                    myPositionRef.current.x += (hitData.direction * hitData.force);
                    myHealthRef.current = Math.max(0, myHealthRef.current - 10);

                    // Si YO muero por un golpe:
                    if (myHealthRef.current <= 0) {
                        oppKillsRef.current += 1; // Le doy el punto al enemigo visualmente
                        myHealthRef.current = 100;
                        myPositionRef.current = { x: window.innerWidth * 0.3, y: 100 };

                        if (stompClientRef.current && stompClientRef.current.connected) {
                            stompClientRef.current.publish({
                                destination: "/app/game.death",
                                body: JSON.stringify({ lobbyId: lobbyId, targetUsername: oppName })
                            });
                        }
                    }
                });

                client.subscribe('/user/queue/game-death', () => {
                    // Si el servidor me avisa de esto, significa que EL ENEMIGO murió.
                    // ¡PUNTO PARA MÍ!
                    myKillsRef.current += 1;
                });
            }
        });

        client.activate();
        stompClientRef.current = client;

        loadGameData();

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [lobbyId, mapId, myCharId, oppCharId, oppName, navigate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            keys.current[e.code] = true;
            keys.current[e.key] = true;
        };
        const handleKeyUp = (e) => {
            keys.current[e.code] = false;
            keys.current[e.key] = false;
        };

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
                if (prev === "FIGHT!") {
                    clearInterval(timer);
                    setGameState("PLAYING");
                    return null;
                }
                if (typeof prev === "number" && prev > 1) return prev - 1;
                return "FIGHT!";
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

                        if (requestRef.current) {
                            cancelAnimationFrame(requestRef.current);
                        }

                        const myFinalKills = myKillsRef.current;
                        const oppFinalKills = oppKillsRef.current;

                        setFinalStats({
                            myKills: myFinalKills,
                            oppKills: oppFinalKills
                        });

                        // GUARDAR EN BD AL TERMINAR
                        if (myFinalKills > oppFinalKills) {
                            recordMatchInDatabase(true); // Victoria
                        } else if (myFinalKills < oppFinalKills) {
                            recordMatchInDatabase(false); // Derrota
                        }
                        // Si hay empate, puedes decidir no guardar nada o gestionarlo.

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
            width: 80, height: 100,
            spriteWidth: 192, spriteHeight: 215,
            velocityY: 0,
            speed: gameAssets.myChar.speed - 2,
            jumpForce: gameAssets.myChar.jumpForce * 2,
            isGrounded: false,
            image: myImage,
            frameX: 0, frameY: 0, maxFrames: 4, fps: 10, frameTimer: 0,
            action: "IDLE", direction: 1,
            isAttacking: false,
            attackCooldown: 0,
            health: 100
        };

        const opponent = {
            id: "p2",
            width: 80, height: 100,
            spriteWidth: 192, spriteHeight: 205,
            image: oppImage,
            frameX: 0, frameY: 0, maxFrames: 4, fps: 10, frameTimer: 0,
            action: "IDLE", direction: -1,
            health: 100
        };

        const gravity = gameAssets.currentMap.gravity;
        let lastTime = 0;

        const gameLoop = (timestamp) => {
            requestRef.current = requestAnimationFrame(gameLoop);

            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            myPlayer.health = myHealthRef.current;
            opponent.health = oppHealthRef.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (bgImage.complete && bgImage.naturalWidth > 0) {
                ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            }

            const platformWidth = canvas.width * 0.7;
            const platformHeight = 40;
            const platformX = (canvas.width - platformWidth) / 2;
            const platformY = canvas.height * 0.7;
            ctx.fillStyle = "#2a2d35";
            ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

            if (myPlayer.attackCooldown > 0) {
                myPlayer.attackCooldown -= deltaTime;
            }

            if (gameState === "PLAYING") {
                let isMoving = false;

                if ((keys.current["Space"] || keys.current[" "]) && myPlayer.attackCooldown <= 0 && !myPlayer.isAttacking) {
                    myPlayer.isAttacking = true;
                    myPlayer.attackCooldown = 500;
                    myPlayer.frameX = 0;

                    const hitboxWidth = 40;
                    const hitboxHeight = myPlayer.height;

                    let hitboxX = myPlayer.direction === 1
                        ? myPositionRef.current.x + myPlayer.width
                        : myPositionRef.current.x - hitboxWidth;
                    let hitboxY = myPositionRef.current.y;

                    const oppX = oppPositionRef.current.x;
                    const oppY = oppPositionRef.current.y;

                    if (
                        hitboxX < oppX + opponent.width &&
                        hitboxX + hitboxWidth > oppX &&
                        hitboxY < oppY + opponent.height &&
                        hitboxY + hitboxHeight > oppY
                    ) {
                        oppHealthRef.current = Math.max(0, oppHealthRef.current - 10);
                        oppPositionRef.current.x += myPlayer.direction * 60;

                        if (stompClientRef.current && stompClientRef.current.connected) {
                            stompClientRef.current.publish({
                                destination: "/app/game.hit",
                                body: JSON.stringify({
                                    lobbyId: lobbyId,
                                    targetUsername: oppName,
                                    direction: myPlayer.direction,
                                    force: 60
                                })
                            });
                        }
                    }
                }

                if (myPlayer.isAttacking && myPlayer.attackCooldown < 200) {
                    myPlayer.isAttacking = false;
                }

                if (!myPlayer.isAttacking) {
                    if (keys.current["ArrowLeft"] || keys.current["KeyA"] || keys.current["a"]) {
                        myPositionRef.current.x -= myPlayer.speed;
                        myPlayer.direction = -1;
                        isMoving = true;
                    }
                    if (keys.current["ArrowRight"] || keys.current["KeyD"] || keys.current["d"]) {
                        myPositionRef.current.x += myPlayer.speed;
                        myPlayer.direction = 1;
                        isMoving = true;
                    }
                    if ((keys.current["ArrowUp"] || keys.current["KeyW"] || keys.current["w"]) && myPlayer.isGrounded) {
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
                } else {
                    myPlayer.action = "ATTACK";
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

                // --- SI CAES AL VACÍO ---
                if (myPositionRef.current.y > canvas.height + 50) {
                    oppKillsRef.current += 1; // Punto para el enemigo
                    myHealthRef.current = 100;
                    myPositionRef.current = { x: window.innerWidth * 0.3, y: -50 };
                    myPlayer.velocityY = 0;

                    if (stompClientRef.current && stompClientRef.current.connected) {
                        stompClientRef.current.publish({
                            destination: "/app/game.death",
                            body: JSON.stringify({ lobbyId: lobbyId, targetUsername: oppName })
                        });
                    }
                }
            }

            const updateAnimation = (player) => {
                const anim = animations[player.action] || animations.IDLE;
                player.frameY = anim.row;

                if (player.frameX < anim.startFrame || player.frameX >= anim.totalFrames) {
                    player.frameX = anim.startFrame;
                }

                if (player.frameTimer > 1000 / player.fps) {
                    player.frameX++;
                    if (player.frameX >= anim.totalFrames) {
                        player.frameX = anim.startFrame;
                    }
                    player.frameTimer = 0;
                } else {
                    player.frameTimer += deltaTime;
                }
            };

            const drawPlayer = (player, startX, startY, label) => {
                updateAnimation(player);
                ctx.save();

                let drawX = startX;
                let drawY = startY;

                if (player.direction === -1) {
                    ctx.translate(startX + player.width, startY);
                    ctx.scale(-1, 1);
                    drawX = 0;
                    drawY = 0;
                }

                if (player.image.complete && player.image.naturalWidth > 0) {
                    ctx.drawImage(
                        player.image,
                        player.frameX * player.spriteWidth, player.frameY * player.spriteHeight,
                        player.spriteWidth, player.spriteHeight,
                        drawX, drawY, player.width, player.height
                    );
                } else {
                    ctx.fillStyle = player.id === "p1" ? "#4CAF50" : "#f44336";
                    ctx.fillRect(drawX, drawY, player.width, player.height);
                }

                ctx.restore();

                ctx.fillStyle = "white";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";

                const textX = startX + player.width / 2;
                const textY = startY - 10;

                ctx.fillText(label, textX, textY);

                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(textX - 40, textY - 28, 80, 6);

                ctx.fillStyle = player.id === "p1" ? "#4CAF50" : "#ff3333";
                const currentHealthWidth = (player.health / 100) * 80;
                ctx.fillRect(textX - 40, textY - 28, currentHealthWidth, 6);
            };

            drawPlayer(myPlayer, myPositionRef.current.x, myPositionRef.current.y, "Tú");
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
        <div className="game-wrapper" tabIndex="0" style={{ outline: "none" }}>
            <canvas ref={canvasRef} className="game-canvas" />

            <div className="ui-layer">
                <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%', margin: '0 auto' }}>
                    <div className="player-deaths" style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '20px' }}>Mis Bajas: {myKillsRef.current}</div>
                    <div className="timer" style={{ fontSize: '28px' }}>{formatTime(timeLeft)}</div>
                    <div className="opp-deaths" style={{ color: '#ff3333', fontWeight: 'bold', fontSize: '20px' }}>Bajas de {oppName}: {oppKillsRef.current}</div>
                </div>

                <div className="center-screen">
                    {countdown !== null && (
                        <div key={countdown} className={`countdown-text ${countdown === "FIGHT!" ? "countdown-fight" : ""}`}>
                            {countdown}
                        </div>
                    )}
                </div>

                {gameState === "ENDED" && finalStats && (
                    <div className="victory-modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, pointerEvents: 'auto'
                    }}>
                        <div className="victory-modal-content" style={{
                            backgroundColor: '#222', padding: '40px', borderRadius: '12px', textAlign: 'center',
                            border: '3px solid var(--color-primary)', minWidth: '400px', color: 'white', boxShadow: '0 0 20px rgba(170,59,255,0.4)', pointerEvents: 'auto'
                        }}>
                            <h1 style={{ color: 'var(--color-primary)', fontSize: '36px', margin: '0 0 10px 0' }}>FIN DE LA PARTIDA</h1>

                            {/* Ahora ganamos si TENEMOS MÁS KILLS que el oponente */}
                            <h2 style={{ fontSize: '28px', color: finalStats.myKills > finalStats.oppKills ? '#4CAF50' : finalStats.myKills < finalStats.oppKills ? '#ff3333' : '#ffb703', margin: '20px 0' }}>
                                {finalStats.myKills > finalStats.oppKills
                                    ? "¡HAS GANADO LA BATALLA!"
                                    : finalStats.myKills < finalStats.oppKills
                                        ? "HAS SIDO DERROTADO"
                                        : "¡UN EMPATE LEGENDARIO!"}
                            </h2>

                            <div className="stats-summary" style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', background: '#333', padding: '20px', borderRadius: '8px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#4CAF50' }}>Tú</h3>
                                    <p style={{ fontSize: '24px', margin: '10px 0 0 0', fontWeight: 'bold' }}>{finalStats.myKills} Bajas</p>
                                </div>
                                <div style={{ borderLeft: '2px solid #555', height: '50px' }}></div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#ff3333' }}>{oppName}</h3>
                                    <p style={{ fontSize: '24px', margin: '10px 0 0 0', fontWeight: 'bold' }}>{finalStats.oppKills} Bajas</p>
                                </div>
                            </div>

                            <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '30px' }}>
                                {finalStats.myKills > finalStats.oppKills
                                    ? "Has demostrado ser el Star Warrior."
                                    : finalStats.myKills < finalStats.oppKills
                                        ? "Entrena más duro y vuelve a intentarlo."
                                        : "Ambos guerreros están al mismo nivel."}
                            </p>

                            <button
                                onClick={() => {
                                    localStorage.removeItem(`game_start_${lobbyId}`);
                                    navigate("/dashboard");
                                }}
                                style={{
                                    padding: '12px 30px', background: 'var(--color-primary)', color: 'white',
                                    border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer'
                                }}
                            >
                                Volver al Menú Principal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}