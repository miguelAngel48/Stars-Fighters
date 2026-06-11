import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { jwtDecode } from "jwt-decode";
import "../Styles/Game.css";
import LevelUpModal from "./LevelUpModal";
import corazonIcon from '../assets/corazon.png';

export default function Game() {

    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const keys = useRef({});
    const stompClientRef = useRef(null);
    const isGameEndedRef = useRef(false);
    const ApiUrl = import.meta.VITE_API_URL
    const [searchParams] = useSearchParams();
    const lobbyId = searchParams.get("lobbyId");
    const mapId = searchParams.get("mapId");
    const myCharId = searchParams.get("myCharId");
    const oppCharId = searchParams.get("oppCharId");
    const oppName = searchParams.get("oppName");
    const navigate = useNavigate();

    const [gameState, setGameState] = useState("LOADING");
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(null);
    const [gameAssets, setGameAssets] = useState(null);
    const [finalStats, setFinalStats] = useState(null);
    const [levelUpData, setLevelUpData] = useState(null);
    const [gameSettings, setGameSettings] = useState(null);

    const isLeftPlayerRef = useRef(true);
    const myPositionRef = useRef({ x: 0, y: 100 });
    const oppPositionRef = useRef({ x: 0, y: 100 });

    const myActionRef = useRef("IDLE");
    const myDirectionRef = useRef(1);
    const oppActionRef = useRef("IDLE");
    const oppDirectionRef = useRef(-1);

    const myHealthRef = useRef(100);
    const oppHealthRef = useRef(100);
    const myLivesRef = useRef(0);
    const oppLivesRef = useRef(0);
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
            const response = await fetch(`${ApiUrl}/api/stats/record?isWinner=${isWinner}&lobbyId=${lobbyId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.leveledUp) {
                    setLevelUpData({ newLevel: data.newLevel });
                }
            }
        } catch (error) { }
    };

    const handleEndGame = (myForcedLoss = false, oppForcedLoss = false) => {
        if (isGameEndedRef.current) return;
        isGameEndedRef.current = true;
        setGameState("ENDED");
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        let myWins = false;
        let tie = false;

        if (myForcedLoss) {
            myWins = false;
        } else if (oppForcedLoss) {
            myWins = true;
        } else {
            if (gameSettings.lives > 0) {
                if (myLivesRef.current > oppLivesRef.current) myWins = true;
                else if (myLivesRef.current === oppLivesRef.current) tie = true;
            } else {
                if (myKillsRef.current > oppKillsRef.current) myWins = true;
                else if (myKillsRef.current === oppKillsRef.current) tie = true;
            }
        }

        setFinalStats({
            myKills: myKillsRef.current,
            oppKills: oppKillsRef.current,
            myLives: myLivesRef.current,
            oppLives: oppLivesRef.current,
            isWin: myWins,
            isTie: tie
        });

        if (gameSettings && gameSettings.mode === "normal") {
            recordMatchInDatabase(myWins && !tie);
        }
    };

    useEffect(() => {
        if (!lobbyId || !mapId || !myCharId || !oppCharId || !oppName) {
            navigate("/dashboard");
            return;
        }

        const token = localStorage.getItem("token");
        const decoded = jwtDecode(token);
        const myUsername = String(decoded.sub).toLowerCase();
        const opponentNameSafe = String(oppName).toLowerCase();

        isLeftPlayerRef.current = myUsername < opponentNameSafe;

        const loadGameData = async () => {
            try {
                const settingsRes = await fetch(`${ApiUrl}/api/lobby/settings/${lobbyId}`, { headers: { "Authorization": `Bearer ${token}` } });
                const charsRes = await fetch(`${ApiUrl}/api/characters`, { headers: { "Authorization": `Bearer ${token}` } });
                const mapsRes = await fetch(`${ApiUrl}/api/maps`, { headers: { "Authorization": `Bearer ${token}` } });

                if (settingsRes.ok && charsRes.ok && mapsRes.ok) {
                    const settings = await settingsRes.json();
                    const chars = await charsRes.json();
                    const maps = await mapsRes.json();

                    setGameSettings(settings);
                    myLivesRef.current = settings.lives;
                    oppLivesRef.current = settings.lives;
                    setTimeLeft(settings.timeLimit > 0 ? settings.timeLimit : null);

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

                    const leftX = window.innerWidth * 0.3;
                    const rightX = window.innerWidth * 0.7 - 80;

                    myPositionRef.current.x = isLeftPlayerRef.current ? leftX : rightX;
                    oppPositionRef.current.x = isLeftPlayerRef.current ? rightX : leftX;

                    myDirectionRef.current = isLeftPlayerRef.current ? 1 : -1;
                    oppDirectionRef.current = isLeftPlayerRef.current ? -1 : 1;

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
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_URL}/ws-stars`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {

                client.subscribe('/user/queue/game-sync', (msg) => {
                    const data = JSON.parse(msg.body);
                    oppPositionRef.current.x = data.x;
                    oppPositionRef.current.y = data.y;
                    oppActionRef.current = data.action || "IDLE";
                    oppDirectionRef.current = data.direction || -1;
                });

                client.subscribe('/user/queue/game-hit', (msg) => {
                    const hitData = JSON.parse(msg.body);
                    myPositionRef.current.x += (hitData.direction * hitData.force);
                    myHealthRef.current = Math.max(0, myHealthRef.current - 10);

                    if (myHealthRef.current <= 0) {
                        myHealthRef.current = 100;

                        if (myLivesRef.current > 0) {
                            myLivesRef.current = Math.max(0, myLivesRef.current - 1);
                        }
                        oppKillsRef.current += 1;

                        const mySpawnX = isLeftPlayerRef.current ? window.innerWidth * 0.3 : window.innerWidth * 0.7 - 80;
                        myPositionRef.current = { x: mySpawnX, y: 100 };

                        let isOver = false;
                        setGameSettings(prev => {
                            if (prev && prev.lives > 0 && myLivesRef.current <= 0) isOver = true;
                            return prev;
                        });

                        if (stompClientRef.current && stompClientRef.current.connected) {
                            stompClientRef.current.publish({
                                destination: "/app/game.death",
                                body: JSON.stringify({ lobbyId: lobbyId, targetUsername: oppName, isGameOver: isOver })
                            });
                        }

                        if (isOver) {
                            handleEndGame(true, false);
                        }
                    }
                });

                client.subscribe('/user/queue/game-death', (msg) => {
                    const deathData = JSON.parse(msg.body);
                    myKillsRef.current += 1;

                    if (oppLivesRef.current > 0) {
                        oppLivesRef.current = Math.max(0, oppLivesRef.current - 1);
                    }
                    oppHealthRef.current = 100;

                    let checkIsOver = deathData.isGameOver;
                    setGameSettings(prev => {
                        if (prev && prev.lives > 0 && oppLivesRef.current <= 0) checkIsOver = true;
                        return prev;
                    });

                    if (checkIsOver) {
                        handleEndGame(false, true);
                    }
                });

                client.subscribe('/user/queue/game-opponent-left', () => {
                    if (!isGameEndedRef.current) {
                        handleEndGame(false, true);
                    }
                });
            }
        });

        client.activate();
        stompClientRef.current = client;

        loadGameData();

        return () => {
            if (stompClientRef.current) {
                if (stompClientRef.current.connected && !isGameEndedRef.current) {
                    stompClientRef.current.publish({
                        destination: "/app/game.leave",
                        body: JSON.stringify({ targetUsername: oppName })
                    });
                }
                stompClientRef.current.deactivate();
            }
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
        if (gameState === "PLAYING" && gameSettings) {
            const matchTimer = setInterval(() => {
                if (gameSettings.timeLimit <= 0) return;

                const savedStr = localStorage.getItem(`game_start_${lobbyId}`);
                if (!savedStr) return;

                const startTime = parseInt(savedStr);
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                const matchElapsed = Math.max(0, elapsedSeconds - 4);
                const remaining = Math.max(0, gameSettings.timeLimit - matchElapsed);

                setTimeLeft(remaining);

                if (remaining <= 0 && !isGameEndedRef.current) {
                    clearInterval(matchTimer);
                    handleEndGame(false, false);
                }
            }, 1000);

            const syncInterval = setInterval(() => {
                if (stompClientRef.current && stompClientRef.current.connected) {
                    stompClientRef.current.publish({
                        destination: "/app/game.sync",
                        body: JSON.stringify({
                            lobbyId: lobbyId,
                            targetUsername: oppName,
                            x: myPositionRef.current.x,
                            y: myPositionRef.current.y,
                            action: myActionRef.current,
                            direction: myDirectionRef.current
                        })
                    });
                }
            }, 1000 / 30);

            return () => {
                clearInterval(matchTimer);
                clearInterval(syncInterval);
            };
        }
    }, [gameState, lobbyId, oppName, gameSettings]);

    useEffect(() => {
        if (gameState === "LOADING" || !gameAssets || !gameSettings) return;

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
            spriteWidth: gameAssets.myChar.spriteWidth || 192,
            spriteHeight: gameAssets.myChar.spriteHeight || 215,
            velocityY: 0,
            speed: gameAssets.myChar.speed - 2,
            jumpForce: gameAssets.myChar.jumpForce * 2,
            isGrounded: false,
            image: myImage,
            frameX: 0, frameY: 0, maxFrames: 4, fps: 10, frameTimer: 0,
            action: "IDLE", direction: myDirectionRef.current,
            isAttacking: false,
            attackCooldown: 0,
            health: 100
        };

        const opponent = {
            id: "p2",
            width: 80, height: 100,
            spriteWidth: gameAssets.oppChar.spriteWidth || 192,
            spriteHeight: gameAssets.oppChar.spriteHeight || 215,
            image: oppImage,
            frameX: 0, frameY: 0, maxFrames: 4, fps: 10, frameTimer: 0,
            action: "IDLE", direction: oppDirectionRef.current,
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

                if (myPositionRef.current.y > canvas.height + 50) {
                    myHealthRef.current = 100;

                    if (gameSettings.lives > 0) {
                        myLivesRef.current = Math.max(0, myLivesRef.current - 1);
                    }
                    oppKillsRef.current += 1;

                    const mySpawnX = isLeftPlayerRef.current ? window.innerWidth * 0.3 : window.innerWidth * 0.7 - 80;
                    myPositionRef.current = { x: mySpawnX, y: -50 };
                    myPlayer.velocityY = 0;

                    let isOver = false;
                    if (gameSettings.lives > 0 && myLivesRef.current <= 0) {
                        isOver = true;
                    }

                    if (stompClientRef.current && stompClientRef.current.connected) {
                        stompClientRef.current.publish({
                            destination: "/app/game.death",
                            body: JSON.stringify({ lobbyId: lobbyId, targetUsername: oppName, isGameOver: isOver })
                        });
                    }

                    if (isOver) {
                        handleEndGame(true, false);
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

            myActionRef.current = myPlayer.action;
            myDirectionRef.current = myPlayer.direction;
            drawPlayer(myPlayer, myPositionRef.current.x, myPositionRef.current.y, "Tú");

            opponent.action = oppActionRef.current;
            opponent.direction = oppDirectionRef.current;
            drawPlayer(opponent, oppPositionRef.current.x, oppPositionRef.current.y, oppName);
        };

        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, gameAssets, gameSettings, oppName]);

    const formatTime = (seconds) => {
        if (seconds === null) return "∞";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const renderLivesOrKills = (lives, kills) => {
        if (gameSettings && gameSettings.lives > 0) {
            const hearts = [];
            for (let i = 0; i < lives; i++) {
                hearts.push(<img key={i} src={corazonIcon} alt="Vida" style={{ width: '22px', height: '22px', marginLeft: '4px', verticalAlign: 'middle' }} />);
            }
            return <span style={{ display: 'flex', alignItems: 'center' }}>Vidas: {hearts}</span>;
        }
        return `Bajas: ${kills}`;
    };

    if (gameState === "LOADING") {
        return <div className="game-wrapper"><div className="loading">Cargando la Arena...</div></div>;
    }

    return (
        <div className="game-wrapper" tabIndex="0" style={{ outline: "none" }}>
            <canvas ref={canvasRef} className="game-canvas" />

            <div className="ui-layer">
                <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%', margin: '0 auto' }}>
                    <div className="player-deaths" style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '20px' }}>
                        {renderLivesOrKills(myLivesRef.current, myKillsRef.current)}
                    </div>
                    <div className="timer" style={{ fontSize: '28px' }}>{formatTime(timeLeft)}</div>
                    <div className="opp-deaths" style={{ color: '#ff3333', fontWeight: 'bold', fontSize: '20px' }}>
                        <span style={{ marginRight: '8px' }}>{oppName} -</span> {renderLivesOrKills(oppLivesRef.current, oppKillsRef.current)}
                    </div>
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

                            <h2 style={{ fontSize: '28px', color: finalStats.isWin ? '#4CAF50' : finalStats.isTie ? '#ffb703' : '#ff3333', margin: '20px 0' }}>
                                {finalStats.isWin
                                    ? "🏆 ¡HAS GANADO LA BATALLA! 🏆"
                                    : finalStats.isTie
                                        ? "🤝 ¡UN EMPATE LEGENDARIO! 🤝"
                                        : "❌ HAS SIDO DERROTADO ❌"}
                            </h2>

                            <div className="stats-summary" style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0', background: '#333', padding: '20px', borderRadius: '8px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#4CAF50' }}>Tú</h3>
                                    <p style={{ fontSize: '18px', margin: '10px 0 0 0', fontWeight: 'bold' }}>Bajas: {finalStats.myKills}</p>
                                    {gameSettings.lives > 0 && <p style={{ fontSize: '18px', margin: '5px 0 0 0', fontWeight: 'bold' }}>Vidas: {finalStats.myLives}</p>}
                                </div>
                                <div style={{ borderLeft: '2px solid #555', height: '50px' }}></div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#ff3333' }}>{oppName}</h3>
                                    <p style={{ fontSize: '18px', margin: '10px 0 0 0', fontWeight: 'bold' }}>Bajas: {finalStats.oppKills}</p>
                                    {gameSettings.lives > 0 && <p style={{ fontSize: '18px', margin: '5px 0 0 0', fontWeight: 'bold' }}>Vidas: {finalStats.oppLives}</p>}
                                </div>
                            </div>

                            <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '10px' }}>
                                {finalStats.isWin
                                    ? "Has demostrado ser el Star Warrior definitivo."
                                    : finalStats.isTie
                                        ? "Ambos guerreros están al mismo nivel."
                                        : "Entrena más duro y vuelve a intentarlo."}
                            </p>

                            {gameSettings.mode === "normal" ? (
                                <div className="rewards-container">
                                    <div className="reward-box reward-coins">
                                        <span className="reward-coins-text">
                                            🪙 +{finalStats.isWin ? 10 : finalStats.isTie ? 0 : 5} Monedas
                                        </span>
                                    </div>
                                    <div className="reward-box reward-xp">
                                        <span className="reward-xp-text">
                                            ✨ +{
                                                (() => {
                                                    const currentLevel = gameAssets?.myChar?.level || 1;
                                                    const baseXP = 100 + (10 * currentLevel);
                                                    return finalStats.isWin ? baseXP : finalStats.isTie ? 0 : Math.floor(baseXP / 2);
                                                })()
                                            } XP
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ margin: '20px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                                    <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>Modo Personalizado: No se otorgan recompensas.</p>
                                </div>
                            )}

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
                {levelUpData && (
                    <LevelUpModal
                        newLevel={levelUpData.newLevel}
                        onClose={() => setLevelUpData(null)}
                    />
                )}
            </div>
        </div>
    );
}