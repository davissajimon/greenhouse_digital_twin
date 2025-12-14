import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import "./Navbar.css";

export default function MainNavbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <Navbar expand="lg" className="calathe-navbar">
      <Container fluid className="container-fluid">
        <div className="calathe-brand" onClick={() => navigate("/")}>
          {/* <img src="/logo.png" alt="logo" /> */}
          <div style={{ fontSize: '24px' }}>🌱</div>
          <span>Calathe</span>
        </div>

        {user && (
          <div className="calathe-right">
            <div className="calathe-login-text">
              Logged in as: <strong>{user.name}</strong>
            </div>
            <Button
              variant="outline-dark"
              size="sm"
              style={{ marginLeft: '12px', borderColor: 'rgba(0,0,0,0.1)' }}
              onClick={() => {
                if (onLogout) onLogout();
                navigate("/login");
              }}
            >
              Logout
            </Button>
          </div>
        )}
      </Container>
    </Navbar>
  )
}