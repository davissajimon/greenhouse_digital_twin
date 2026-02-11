import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DarkModeProvider } from "./DarkModeContext";
import { NatureLoader } from "./components/NatureLoader";

// Lazy load all major components for better code splitting
const Home = React.lazy(() => import("./Home"));
const Simulator = React.lazy(() => import("./Simulator"));
const MainNavbar = React.lazy(() => import("./Navbar"));
const Footer = React.lazy(() => import("./Footer"));
const ScalabilityTest = React.lazy(() => import("./scalability_test"));

// Reusable loading fallback component
const LoadingFallback = ({ message }) => (
  <NatureLoader message={message} />
);

function App() {
  return (
    <DarkModeProvider>
      <div className="cinematic-noise"></div>
      <Router>
        <React.Suspense fallback={<LoadingFallback message="Loading..." />}>
          <MainNavbar />
        </React.Suspense>

        <Routes>
          <Route path="/">
            <Route
              index
              element={
                <React.Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <Home />
                </React.Suspense>
              }
            />
            <Route
              path="Sim"
              element={
                <React.Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <Simulator />
                </React.Suspense>
              }
            />
            <Route
              path="scalability"
              element={
                <React.Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <ScalabilityTest />
                </React.Suspense>
              }
            />
          </Route>
        </Routes>
        <ConditionalFooter />
      </Router>
    </DarkModeProvider>
  );
}

const ConditionalFooter = () => {
  // Simple check, or use useLocation
  // To use useLocation, we need to be inside the Router. We are inside Router in App return.
  // We can't use useLocation() directly in App() because App() *creates* the Router.
  // But we can use a child component.
  return <FooterWrapper />;
};

const FooterWrapper = () => {
  const location = useLocation();
  // Hide footer on Home ('/') and Scalability ('/scalability') as per "Focused" requests
  if (location.pathname === '/' || location.pathname === '/scalability' || location.pathname === '/Sim') return null;
  return <Footer />;
}

export default App;
