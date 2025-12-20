import React, { useState, useEffect } from "react";
import "./App.css";
import Home from "./Home";
import Loginpage from "./Loginpage";
import Simulator from "./Simulator";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainNavbar from "./Navbar";
import Footer from "./Footer";
import { DarkModeProvider } from "./DarkModeContext";

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
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Loginpage onLogin={handleLogin} />
          }
        />
      </Routes>
      <Footer />
      </Router>
    </DarkModeProvider>
  );
}

export default App;
