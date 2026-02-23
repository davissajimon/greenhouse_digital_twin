import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { AUTH_API_URL } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // const [user, setUser] = useState(null);
    // const [token, setToken] = useState(() => localStorage.getItem("gdt_token") || null);
    // const [loading, setLoading] = useState(true);

    // Mocked state to bypass login
    const [user] = useState({ name: "Demo User", ntfy_topic: "demo-topic", alerts_enabled: false });
    const [token] = useState("mock-token");
    const [loading] = useState(false);

    // Verify JWT on first mount (commented out)
    useEffect(() => {
        /*
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
        */
    }, []);

    const login = useCallback(async () => {
        /*
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
        */
        return { token: "mock", user: { name: "Demo User" } };
    }, []);

    const register = useCallback(async () => {
        /*
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
        */
        return { token: "mock", user: { name: "Demo User" } };
    }, []);

    const logout = useCallback(() => {
        /*
        localStorage.removeItem("gdt_token");
        setToken(null);
        setUser(null);
        */
    }, []);

    const toggleAlerts = useCallback(async () => {
        /*
        const res = await fetch(`${AUTH_API_URL}/auth/toggle_alerts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ enabled })
        });
        if (res.ok) setUser(u => ({ ...u, alerts_enabled: enabled }));
        */
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, toggleAlerts, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
