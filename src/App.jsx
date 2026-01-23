import React, { useState, useEffect } from "react";
import "./App.css";
import Home from "./Home";
import Loginpage from "./Loginpage";
import Simulator from "./Simulator";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainNavbar from "./Navbar";
import Footer from "./Footer";
import { DarkModeProvider } from "./DarkModeContext";

const ScalabilityTest = React.lazy(() => import("./scalability_test"));

function App() {
  const [navVisible, setNavVisible] = useState(true);

  return (
    <DarkModeProvider>
      <div className="cinematic-noise"></div>
      <Router>
        <MainNavbar visible={navVisible} />

        <Routes>
          <Route
            path="/"
            element={<Home setNavVisible={setNavVisible} />}
          />

          <Route
            path="/Sim"
            element={<Simulator />}
          />

          <Route
            path="/scalability"
            element={
              <React.Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading Scalability Test...</div>}>
                <ScalabilityTest />
              </React.Suspense>
            }
          />
        </Routes>
        <ConditionalFooter />
      </Router>
    </DarkModeProvider>
  );
}

const ConditionalFooter = () => {
  const location = window.location; // Simple check, or use useLocation
  // To use useLocation, we need to be inside the Router. We are inside Router in App return.
  // We can't use useLocation() directly in App() because App() *creates* the Router.
  // But we can use a child component.
  return <FooterWrapper />;
};

// Helper to access router context
import { useLocation } from "react-router-dom";
const FooterWrapper = () => {
  const location = useLocation();
  // Hide footer on Home ('/') and Scalability ('/scalability') as per "Focused" requests
  if (location.pathname === '/' || location.pathname === '/scalability' || location.pathname === '/Sim') return null;
  return <Footer />;
}

export default App;
