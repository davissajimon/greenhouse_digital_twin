import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
    const [tab, setTab] = useState("login"); // "login" | "register"
    const [name, setName] = useState("");
    const [ntfyTopic, setNtfyTopic] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { login, register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (tab === "login") {
                await login(ntfyTopic.trim(), password);
            } else {
                if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
                await register(name.trim(), ntfyTopic.trim(), password);
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (t) => { setTab(t); setError(""); setNtfyTopic(""); };

    return (
        <div className="login-page">
            {/* Animated Ambient Background Shapes */}
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            <div className="bg-shape shape-3"></div>

            <div className="glass-panel">
                <div className="login-logo">
                    <div className="login-logo-icon">🌱</div>
                    <h1>GreenSim</h1>
                    <p>Digital Twin</p>
                </div>

                <div className="login-tabs">
                    <button type="button" className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>
                        Login
                    </button>
                    <button type="button" className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => switchTab("register")}>
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {tab === "register" && (
                        <div className="input-group">
                            <span className="input-icon">👤</span>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <span className="input-icon">🔔</span>
                        <input
                            type="text"
                            placeholder={tab === "register" ? "Topic Name (e.g. secret-xyz)" : "Topic Name"}
                            value={ntfyTopic}
                            onChange={e => setNtfyTopic(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <span className="input-icon">🔒</span>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="login-submit-btn" type="submit" disabled={loading}>
                        {loading ? "Processing..." : (tab === "login" ? "Enter System" : "Join Platform")}
                    </button>

                    {error && <div className="error-message">{error}</div>}
                </form>
            </div>
        </div>
    );
}
