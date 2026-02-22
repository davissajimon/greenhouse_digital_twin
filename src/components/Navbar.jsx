import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function MainNavbar({ visible = true }) {
  const { user, logout, toggleAlerts } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setShowUserMenu(false);
  };

  return (
    <nav className={`navbar-main ${visible ? '' : 'hidden'}`}>
      <div className="navbar-container">

        {/* Brand – Left */}
        <div className="navbar-brand" onClick={() => scrollTo("section-home")}>
          <span className="navbar-logo">🌱</span>
          <span className="navbar-title">GDT</span>
        </div>

        {/* Center Navigation Links */}
        <div className="navbar-links">
          <button className="nav-link" onClick={() => scrollTo("section-home")}>Home</button>
          <button className="nav-link" onClick={() => scrollTo("section-geo")}>Geo Sim</button>
          <button className="nav-link" onClick={() => scrollTo("section-simulator")}>Lab</button>
        </div>

        {/* Right – User */}
        <div className="navbar-right">
          {user && (
            <div className="navbar-user-wrap">
              <button
                className="navbar-user-chip"
                onClick={() => setShowUserMenu(v => !v)}
                title="Account settings"
              >
                <span className="navbar-user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="navbar-user-chip-name">{user.name.split(" ")[0]}</span>
                <span className="navbar-chevron">{showUserMenu ? "▲" : "▼"}</span>
              </button>

              {showUserMenu && (
                <div className="navbar-user-dropdown">
                  <div className="navbar-dropdown-header">
                    <div className="navbar-dropdown-name">{user.name}</div>
                    <div className="navbar-dropdown-phone">📡 Topic: <code style={{ fontSize: '0.72rem', opacity: 0.7 }}>{user.ntfy_topic}</code></div>
                  </div>

                  <div className="navbar-dropdown-divider" />

                  {/* SMS toggle */}
                  <div className="navbar-sms-row">
                    <div>
                      <div className="navbar-sms-label">SMS Alerts</div>
                      <div className="navbar-sms-sub">
                        {user.alerts_enabled ? "Push alerts → ntfy app" : "Alerts disabled"}
                      </div>
                    </div>
                    <button
                      className={`navbar-sms-toggle ${user.alerts_enabled ? "on" : "off"}`}
                      onClick={() => toggleAlerts(!user.alerts_enabled)}
                      title="Toggle SMS alerts"
                    >
                      {user.alerts_enabled ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="navbar-dropdown-divider" />

                  <button className="navbar-logout-btn" onClick={logout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}