import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
    const [tab, setTab] = useState("login");  // "login" | "register"
    const [name, setName] = useState("");
    const [ntfyTopic, setNtfyTopic] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { login, register } = useAuth();
    const navigate = useNavigate();

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
            navigate("/");
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (t) => { setTab(t); setError(""); setNtfyTopic(""); };

    // Generate a random suffix for topic name suggestion
    const suggestedTopic = `greensim-${Math.random().toString(36).slice(2, 7)}`;

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">🌱</div>
                    <h1>GreenSim</h1>
                    <p>Digital Twin Greenhouse</p>
                </div>

                {/* Tabs */}
                <div className="login-tabs">
                    <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>
                        Sign In
                    </button>
                    <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => switchTab("register")}>
                        Register
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {tab === "register" && (
                        <div className="login-field">
                            <label>Full Name</label>
                            <input
                                className="login-input"
                                type="text"
                                placeholder="e.g. Davis Sajimon"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="login-field">
                        <label>{tab === "register" ? "Your Alert Topic Name" : "Alert Topic Name"}</label>
                        <input
                            className="login-input"
                            type="text"
                            placeholder={tab === "register" ? `e.g. ${suggestedTopic}` : "your-topic-name"}
                            value={ntfyTopic}
                            onChange={e => setNtfyTopic(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                            required
                        />
                        {tab === "register" && (
                            <div className="login-hint">
                                Make it unique and secret (e.g. <code>{suggestedTopic}</code>). You'll subscribe to this in the ntfy app to receive phone alerts.
                            </div>
                        )}
                    </div>

                    <div className="login-field">
                        <label>Password</label>
                        <input
                            className="login-input"
                            type="password"
                            placeholder={tab === "register" ? "At least 6 characters" : "Your password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? "Please wait…" : (tab === "login" ? "Sign In" : "Create Account")}
                    </button>

                    {error && <div className="login-error">⚠ {error}</div>}
                </form>

                {tab === "register" && (
                    <div className="login-sms-notice">
                        <span>📱</span>
                        <span>
                            Install the free <strong>ntfy</strong> app on your phone → subscribe to your topic name → receive instant plant health alerts for free.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
