import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import "./Navbar.css";

export default function MainNavbar() {
  const navigate = useNavigate();

  return (
  <Navbar expand="lg" className="calathe-navbar">
    <Container fluid className="container-fluid">
      <div className="calathe-brand" onClick={() => navigate("/")}>
        <img src="/logo.png" alt="logo" />
        <span>Calathe</span>
      </div>

      {/* <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav" className="justify-content-end"> */}
        {/* <div className="calathe-right"> */}
          {/* <Button className="calathe-btn" onClick={() => navigate("/Sim")}>Simulate</Button> */}
          <div className="calathe-login-text">Logged in as: <strong>Guest</strong></div>
        {/* </div> */}
      {/* </Navbar.Collapse> */}
    </Container>
  </Navbar>
)
}