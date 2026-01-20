import React, { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Simulator.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import Navbar from "./Navbar";
import { evaluatePlantHealth } from "./utils/PlantHealthEngine";
import { applyEdgeCorrections } from "./utils/SensorCorrelations";

function Loader() {
  return <Html center><div style={{ color: 'white' }}>Loading...</div></Html>;
}

function ErrorFallback() {
  return (
    <Html center>
      <div style={{ color: '#ff6b6b', fontSize: '16px', textAlign: 'center' }}>
        <p>Failed to load 3D model</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Please try refreshing the page</p>
      </div>
    </Html>
  );
}

export default function Simulator() {
  const navigate = useNavigate();
  const [plant, setPlant] = useState("tomato");
  const [hasError, setHasError] = useState(false);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });
  const viewportRef = useRef(null);

  // Manual Sim State
  const [controls, setControls] = useState({
    temperature: 25,
    humidity: 50,
    soil_moisture: 45,
    soil_temperature: 20,
    light: 500
  });

  const [correlationMsg, setCorrelationMsg] = useState(null);
  const msgTimer = React.useRef(null);

  const updateControl = (key, value) => {
    const numValue = Number(value);
    const nextState = { ...controls, [key]: numValue };

    // Apply automatic corrections
    const { newState, adjusted, reasons } = applyEdgeCorrections(nextState, key);

    setControls(newState);

    if (adjusted) {
      if (msgTimer.current) clearTimeout(msgTimer.current);
      setCorrelationMsg(reasons[0] || "Adjusting for realism...");
      msgTimer.current = setTimeout(() => {
        setCorrelationMsg(null);
        msgTimer.current = null;
      }, 3000);
    }
  };

  // Evaluate Health Real-time
  const healthStatus = useMemo(() => evaluatePlantHealth(controls), [controls]);

  // Handle window resize for responsive scaling
  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        const width = viewportRef.current.clientWidth;
        const height = viewportRef.current.clientHeight;
        setViewportSize({ width, height });
      }
    };

    // Initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle page refresh - keep user on Simulator page if it loads successfully
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('simulatorActive', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clear the flag on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionStorage.removeItem('simulatorActive');
    };
  }, []);

  // Error boundary fallback
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        setHasError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <div className="sim-container">
      <Navbar />

      <div className="sim-content">

        {/* Main 3D Viewport */}
        <div className="sim-viewport-wrapper" ref={viewportRef}>
          {hasError ? (
            <ErrorFallback />
          ) : (
            <Canvas 
              camera={{ position: [0, 1, 5], fov: 50 }} 
              shadows
              style={{ width: '100%', height: '100%' }}
              onError={() => setHasError(true)}
            >
              <color attach="background" args={['#181a1b']} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
              <Environment preset="city" />

              <Suspense fallback={<Loader />}>
                {plant === "tomato" && <ThreeTomato data={controls} />}
                {plant === "chilli" && <ThreeChilli data={controls} />}
                {plant === "pea" && <ThreePea data={controls} />}

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                  <circleGeometry args={[10, 64]} />
                  <meshStandardMaterial color="#0a0a0f" roughness={0.6} metalness={0.4} opacity={0.8} transparent />
                </mesh>
              </Suspense>

              <OrbitControls minPolarAngle={0.5} maxPolarAngle={1.6} />
            </Canvas>
          )}

          {/* HUD Overlay for Controls */}
          <div className="sim-controls-overlay">
            <h2>Simulation Lab</h2>

            {/* Plant Selector */}
            <div className="sim-select-group">
              <label>Selected Plant</label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="sim-dropdown"
              >
                <option value="tomato">Tomato Plant</option>
                <option value="chilli">Chilli Plant</option>
                <option value="pea">Pea Plant</option>
              </select>
            </div>

            {/* Status Indicator */}
            <div className="sim-status" style={{ borderLeftColor: healthStatus.color }}>
              <span className="status-label">Detected Condition</span>
              <span className="status-value" style={{ color: healthStatus.color }}>
                {healthStatus.label}
              </span>
            </div>

            {/* Correlation Feedback */}
            {correlationMsg && (
              <div style={{
                marginTop: '12px', padding: '8px 12px', background: 'rgba(74, 155, 127, 0.2)',
                border: '1px solid #4A9B7F', borderRadius: '6px', fontSize: '0.85rem', color: '#8FBC8F',
                animation: 'fadeIn 0.3s'
              }}>
                ℹ️ {correlationMsg}
              </div>
            )}

            {/* Sliders */}
            <div className="sim-slider-group">
              <div className="slider-item">
                <div className="slider-header">
                  <span>Air Temp</span>
                  <span className="slider-value">{controls.temperature}°C</span>
                </div>
                <input
                  type="range" min="-20" max="70" step="0.5"
                  value={controls.temperature}
                  onChange={(e) => updateControl("temperature", e.target.value)}
                />
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <span>Humidity</span>
                  <span className="slider-value">{controls.humidity}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={controls.humidity}
                  onChange={(e) => updateControl("humidity", e.target.value)}
                />
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <span>Soil Moisture</span>
                  <span className="slider-value">{controls.soil_moisture}%</span>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={controls.soil_moisture}
                  onChange={(e) => updateControl("soil_moisture", e.target.value)}
                />
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <span>Soil Temp</span>
                  <span className="slider-value">{controls.soil_temperature}°C</span>
                </div>
                <input
                  type="range" min="-10" max="40" step="1"
                  value={controls.soil_temperature}
                  onChange={(e) => updateControl("soil_temperature", e.target.value)}
                />
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <span>Light</span>
                  <span className="slider-value">{controls.light}</span>
                </div>
                <input
                  type="range" min="0" max="1500" step="50"
                  value={controls.light}
                  onChange={(e) => updateControl("light", e.target.value)}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '10px' }}>
              Adjust sliders to trigger conditions like Frost, Heat Stress, Root Rot, etc.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
