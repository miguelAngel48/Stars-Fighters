import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoadingUser(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                localStorage.removeItem("token");
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, setUser, refreshUser: fetchUser, loadingUser }}>
            {children}
        </UserContext.Provider>
    );
};