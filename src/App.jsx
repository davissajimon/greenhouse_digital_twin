// src/App.jsx
import React from "react";
import "./App.css";
import Home from "./Home";
import Loginpage from "./Loginpage";
import Simulator from "./Simulator";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainNavbar from "./Navbar";
import Footer from "./Footer";

function App() {
  return (
    <Router>
    
      <MainNavbar />

      <Routes>
        <Route path="/" element={<Home />} />
   
        <Route path="/Sim" element={<Simulator />} />
        <Route path="/login" element={<Loginpage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
