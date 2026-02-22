import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AUTH_API_URL } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("gdt_token") || null);
    const [loading, setLoading] = useState(true);
    const verifiedRef = useRef(false);

    // Verify JWT on first mount
    useEffect(() => {
        if (verifiedRef.current) return;
        verifiedRef.current = true;

        if (!token) {
            setLoading(false);
            return;
        }
        fetch(`${AUTH_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => { setUser(data); setLoading(false); })
            .catch(() => {
                localStorage.removeItem("gdt_token");
                setToken(null);
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (ntfyTopic, password) => {
        const res = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ntfy_topic: ntfyTopic, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        localStorage.setItem("gdt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    }, []);

    const register = useCallback(async (name, ntfyTopic, password) => {
        const res = await fetch(`${AUTH_API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, ntfy_topic: ntfyTopic, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        localStorage.setItem("gdt_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("gdt_token");
        setToken(null);
        setUser(null);
    }, []);

    const toggleAlerts = useCallback(async (enabled) => {
        const res = await fetch(`${AUTH_API_URL}/auth/toggle_alerts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });
        if (res.ok) setUser(u => ({ ...u, alerts_enabled: enabled }));
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, toggleAlerts, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
