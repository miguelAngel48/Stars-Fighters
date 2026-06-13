import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const stompClientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

        const connect = useCallback((token) => {
        if (stompClientRef.current && stompClientRef.current.connected) return;

        const WS_URL = import.meta.env.VITE_WS_URL;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${WS_URL}/ws-stars`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => setIsConnected(true),
            onDisconnect: () => setIsConnected(false),
            onStompError: () => setIsConnected(false),
        });

        client.activate();
        stompClientRef.current = client;
    }, []);

    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            connect(token);
        }
        return () => disconnect();
    }, [connect, disconnect]);

    return (
        <WebSocketContext.Provider value={{ clientRef: stompClientRef, isConnected, connect, disconnect }}>
            {children}
        </WebSocketContext.Provider>
    );
};