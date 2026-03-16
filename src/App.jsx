import React, { useState, useCallback, useMemo } from "react";
import "./App.css";
import { DarkModeProvider } from "./context/DarkModeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NatureLoader } from "./components/NatureLoader";
import { PlantProgressBar } from "./components/PlantProgressBar";
import { AmbientMusic } from "./components/AmbientMusic";

// Lazy load all major components for better code splitting
const Home = React.lazy(() => import("./pages/Home"));
const GeoSection = React.lazy(() => import("./pages/GeoSection"));
const Simulator = React.lazy(() => import("./pages/Simulator"));
const Footer = React.lazy(() => import("./components/Footer"));
// const Login = React.lazy(() => import("./pages/Login"));

// ── Inner app — only rendered after auth is resolved ──────────────────────
function MainApp() {
  const { loading } = useAuth();

  /*
  // Test notification every 30 seconds
  React.useEffect(() => {
    if (isAuthenticated && user?.ntfy_topic) {
      const topic = user.ntfy_topic;
      const interval = setInterval(() => {
        fetch(`https://ntfy.sh/${topic}`, {
          method: 'POST',
          headers: {
            'Title': 'Test Alert - GreenSim',
            'Tags': 'test_tube,seedling',
            'Priority': '3'
          },
          body: `Test notification at ${new Date().toLocaleTimeString()} (Testing active condition)`
        }).then(res => console.log('Test ntfy sent:', res.status))
          .catch(err => console.error('Test ntfy failed:', err));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Apply scroll lock when login screen is active
  React.useEffect(() => {
    if (!isAuthenticated && !loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isAuthenticated, loading]);
  */

  // While verifying JWT, show a minimal spinner
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101827" }}>
        <NatureLoader message="Authenticating…" />
      </div>
    );
  }

  return (
    <>
      {/* Show login OVERLAY if not authenticated (commented out) 
      {!isAuthenticated && (
        <React.Suspense fallback={null}>
          <Login />
        </React.Suspense>
      )}
      */}

      {/* Always render the main app behind it so everything loads */}
      <AuthenticatedApp />
    </>
  );
}

function AuthenticatedApp() {
  // Lifted geo weather state — shared between GeoSection and Simulator
  const [geoWeather, setGeoWeather] = useState(null);

  /* ═══ GLOBAL LOADING GATE ═══
     Tracks which sections have finished loading their heavy assets.
     The NatureLoader stays visible until ALL sections report ready. */
  const [readySections, setReadySections] = useState({
    home: false,
    geo: false,
    simulator: false,
  });

  const markReady = useCallback((section) => {
    setReadySections(prev => {
      if (prev[section]) return prev; // already marked
      return { ...prev, [section]: true };
    });
  }, []);

  const allReady = useMemo(
    () => readySections.home && readySections.geo && readySections.simulator,
    [readySections]
  );

  /* Delay the final reveal by 0.5s for smoother experience */
  const [appReady, setAppReady] = React.useState(false);
  React.useEffect(() => {
    if (allReady) {
      const t = setTimeout(() => setAppReady(true), 500);
      return () => clearTimeout(t);
    }
  }, [allReady]);

  const onHomeReady = useCallback(() => markReady("home"), [markReady]);
  const onGeoReady = useCallback(() => markReady("geo"), [markReady]);
  const onSimulatorReady = useCallback(() => markReady("simulator"), [markReady]);

  return (
    <>
      <div className="cinematic-noise"></div>

      {/* ═══ GLOBAL LOADER — covers everything until all sections ready ═══ */}
      {!appReady && (
        <div className="global-loader-wrapper">
          <NatureLoader message="Preparing your greenhouse…" />
        </div>
      )}

      <div
        className="scroll-root"
        id="scroll-root"
        style={{ opacity: appReady ? 1 : 0, transition: "opacity 0.6s ease" }}
      >
        {/* ═══ SECTION 1: HOME / HERO ═══ */}
        <section className="scroll-section" id="section-home">
          <React.Suspense fallback={null}>
            <Home onReady={onHomeReady} startAnimation={appReady} />
          </React.Suspense>
        </section>

        {/* ═══ SECTION 2: GEO SIMULATION ═══ */}
        <section className="scroll-section" id="section-geo">
          <React.Suspense fallback={null}>
            <GeoSection
              geoWeather={geoWeather}
              onWeatherUpdate={setGeoWeather}
              onReady={onGeoReady}
            />
          </React.Suspense>
        </section>

        {/* ═══ SECTION DIVIDER ═══ */}
        <div className="section-divider">
          <div className="divider-glow"></div>
          <div className="divider-label">
            <span className="divider-icon">🔬</span>
            <span>SIMULATION LAB</span>
          </div>
          <div className="divider-glow"></div>
        </div>

        {/* ═══ SECTION 3: SIMULATOR ═══ */}
        <section className="scroll-section" id="section-simulator">
          <React.Suspense fallback={null}>
            <Simulator geoWeather={geoWeather} onReady={onSimulatorReady} />
          </React.Suspense>
        </section>

        {/* ═══ FOOTER ═══ */}
        <React.Suspense fallback={null}>
          <Footer />
        </React.Suspense>
      </div>

      {/* ═══ SCROLL PROGRESS PLANT ═══ */}
      {appReady && <PlantProgressBar scrollContainerId="scroll-root" />}
      {appReady && <AmbientMusic />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <MainApp />
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;


