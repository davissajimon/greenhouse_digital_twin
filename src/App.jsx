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

// Wrapper for protected routes
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Check login status on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("app_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("app_user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <DarkModeProvider>
      <Router>
        <MainNavbar user={user} onLogout={handleLogout} />

        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Sim"
            element={
              <ProtectedRoute user={user}>
                <Simulator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scalability"
            element={
              <ProtectedRoute user={user}>
                <React.Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading Scalability Test...</div>}>
                  <ScalabilityTest />
                </React.Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Loginpage onLogin={handleLogin} />
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
  if (location.pathname === '/' || location.pathname === '/scalability') return null;
  return <Footer />;
}

export default App;
