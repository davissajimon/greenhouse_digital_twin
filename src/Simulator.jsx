import React, { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Simulator.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import { evaluatePlantHealth } from "./utils/PlantHealthEngine";
import { applyEdgeCorrections } from "./utils/SensorCorrelations";

function Loader() {
  return <Html center><div style={{ color: 'white', fontFamily: 'var(--font-hero)' }}>Loading...</div></Html>;
}

function ErrorFallback() {
  return (
    <Html center>
      <div style={{ color: '#ff6b6b', fontSize: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '8px' }}>
        <p>Failed to load 3D model</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>Please refresh the page</p>
      </div>
    </Html>
  );
}

export default function Simulator() {
  const navigate = useNavigate();
  const [plant, setPlant] = useState("tomato");
  const [hasError, setHasError] = useState(false);

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
  const healthStatus = useMemo(() => evaluatePlantHealth({ ...controls, species: plant }), [controls, plant]);

  // Dynamic Lighting Calculation
  const lighting = useMemo(() => {
    const lux = controls.light;
    const isNight = lux < 200;

    // Intensity mapping
    const ambientInt = 0.1 + (lux / 1500) * 0.8;
    const dirInt = (lux / 1000) * 2.0;

    // Color & Position
    const sunColor = isNight ? '#88aaff' : '#fff5cc'; // Moon Blue vs Sun Warm
    const sunPos = isNight ? [-10, 10, -5] : [10, 15, 10]; // Opposite sides

    // Background Interpolation
    const bgHex = isNight ? '#04060f' : '#101827'; // Matched Home dark bg

    return { ambientInt, dirInt, sunColor, sunPos, bgHex, isNight };
  }, [controls.light]);

  // Handle page refresh logic
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('simulatorActive', 'true');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionStorage.removeItem('simulatorActive');
    };
  }, []);

  // Error boundary reset
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => setHasError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <div className="sim-container">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate('/')}>
        &larr; Home
      </button>

      {/* Main 3D Viewport - Absolute Background */}
      <div className="sim-viewport-wrapper">
        {hasError ? (
          <ErrorFallback />
        ) : (
          <Canvas
            camera={{ position: [0, 1, 5], fov: 50 }}
            shadows
            style={{ width: '100%', height: '100%' }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            onError={() => setHasError(true)}
          >
            <color attach="background" args={[lighting.bgHex]} />
            <ambientLight intensity={lighting.ambientInt} />
            <directionalLight
              position={lighting.sunPos}
              intensity={lighting.dirInt}
              color={lighting.sunColor}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0005}
            />

            {/* Visual Sun/Moon */}
            <mesh position={lighting.sunPos}>
              <sphereGeometry args={[isFinite(lighting.dirInt) && lighting.dirInt > 0 ? 0.8 : 0, 32, 32]} />
              <meshBasicMaterial color={lighting.sunColor} toneMapped={false} />
            </mesh>

            <Environment preset="city" />

            <Suspense fallback={<Loader />}>
              {plant === "tomato" && <ThreeTomato data={controls} />}
              {plant === "chilli" && <ThreeChilli data={controls} />}
              {plant === "okra" && <ThreePea data={controls} />}

              {/* Floor Circle */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <circleGeometry args={[10, 64]} />
                <meshStandardMaterial color="#0a0a0f" roughness={0.6} metalness={0.4} opacity={0.8} transparent />
              </mesh>
            </Suspense>

            <OrbitControls minPolarAngle={0.2} maxPolarAngle={1.6} enablePan={false} />
          </Canvas>
        )}
      </div>

      {/* Floating Glass Control Panel */}
      <div className="sim-controls-overlay">
        <h2>Simulation Lab</h2>

        <div className="sim-select-group">
          <label>Selected Specimen</label>
          <select
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            className="sim-dropdown"
          >
            <option value="tomato">Tomato (Solanum lycopersicum)</option>
            <option value="chilli">Chilli (Capsicum annuum)</option>
            <option value="okra">Okra (Abelmoschus esculentus)</option>
          </select>
        </div>

        <div className="sim-status" style={{ borderLeftColor: healthStatus.color }}>
          <span className="status-label">Live Diagnosis</span>
          <span className="status-value" style={{ color: healthStatus.color }}>
            {healthStatus.label}
          </span>
        </div>

        {correlationMsg && (
          <div style={{
            padding: '8px 12px', background: 'rgba(74, 155, 127, 0.2)',
            border: '1px solid #4A9B7F', borderRadius: '6px', fontSize: '0.8rem', color: '#8FBC8F',
            animation: 'fadeIn 0.3s'
          }}>
            ℹ️ {correlationMsg}
          </div>
        )}

        <div className="sim-slider-group">
          <SliderControl
            label="Air Temperature"
            value={controls.temperature}
            unit="°C"
            min={-10} max={60} step={0.5}
            onChange={(v) => updateControl("temperature", v)}
          />
          <SliderControl
            label="Relative Humidity"
            value={controls.humidity}
            unit="%"
            min={0} max={100} step={1}
            onChange={(v) => updateControl("humidity", v)}
          />
          <SliderControl
            label="Soil Moisture"
            value={controls.soil_moisture}
            unit="%"
            min={0} max={100} step={1}
            onChange={(v) => updateControl("soil_moisture", v)}
          />
          <SliderControl
            label="Soil Temperature"
            value={controls.soil_temperature}
            unit="°C"
            min={-5} max={45} step={1}
            onChange={(v) => updateControl("soil_temperature", v)}
          />
          <SliderControl
            label="Light Intensity"
            value={controls.light}
            unit="lux"
            min={0} max={2000} step={50}
            onChange={(v) => updateControl("light", v)}
          />
        </div>
      </div>
    </div>
  );
}

// Helper for cleaner code
function SliderControl({ label, value, unit, min, max, step, onChange }) {
  return (
    <div className="slider-item">
      <div className="slider-header">
        <span>{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
