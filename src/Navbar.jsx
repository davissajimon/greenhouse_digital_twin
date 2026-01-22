import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDarkMode } from "./DarkModeContext";
import "./Navbar.css";

export default function MainNavbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar-main">
      <div className="navbar-container">
        {/* Brand Section */}
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <span className="navbar-logo">🌱</span>
          <span className="navbar-title">Calathe</span>
        </div>

        {/* Center Navigation Links */}
        <div className="navbar-links">
          <button className={`nav-link ${isActive('/')}`} onClick={() => navigate("/")}>Home</button>
          <button className={`nav-link ${isActive('/Sim')}`} onClick={() => navigate("/Sim")}>Simulator</button>
          <button className={`nav-link ${isActive('/scalability')}`} onClick={() => navigate("/scalability")}>Scalability</button>
        </div>

        {/* Right Section */}
        {user && (
          <div className="navbar-right">
            {/* User Info */}
            <div className="navbar-user-info">
              <span className="navbar-user-label">Welcome,</span>
              <span className="navbar-user-name">{user.name}</span>
            </div>

            {/* Theme Toggle */}
            <button
              className="navbar-theme-toggle"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Logout Button */}
            <button
              className="navbar-logout-btn"
              onClick={() => {
                if (onLogout) onLogout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}