import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "./Navbar.css";

export default function MainNavbar({ visible = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className={`navbar-main ${visible ? '' : 'hidden'}`}>
      <div className="navbar-container">
        {/* Brand Section */}
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <span className="navbar-logo">🌱</span>
          <span className="navbar-title">GDT</span>
        </div>

        {/* Center Navigation Links */}
        <div className="navbar-links">
          <button className={`nav-link ${isActive('/')}`} onClick={() => navigate("/")}>Home</button>
          <button className={`nav-link ${isActive('/Sim')}`} onClick={() => navigate("/Sim")}>Simulator</button>
          <button className={`nav-link ${isActive('/scalability')}`} onClick={() => navigate("/scalability")}>Scalability</button>
        </div>
      </div>
    </nav>
  );
}