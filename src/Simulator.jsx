import React, { useState, useMemo, Suspense, useEffect } from "react";
import "./Simulator.css";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { Vector3 } from "three";
import { NatureLoader } from "./components/NatureLoader";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import { evaluatePlantHealth } from "./utils/PlantHealthEngine";
import { applyEdgeCorrections } from "./utils/SensorCorrelations";

// --- CAMERA INTRO COMPONENT ---
function CameraIntro({ onFinish }) {
  const { camera } = useThree();
  const vec = useMemo(() => new Vector3(), []); // Stable reference

  useEffect(() => {
    // Start way out and high
    camera.position.set(15, 8, 15);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  useFrame((state) => {
    // Lerp towards target position [0, 1.5, 6]
    state.camera.position.lerp(vec.set(0, 1.5, 6), 0.05);
    state.camera.lookAt(0, 1, 0);

    // If close enough, finish animation to hand off to OrbitControls
    if (state.camera.position.distanceTo(vec) < 0.1) {
      onFinish();
    }
  });
  return null;
}

// --- CANVAS CLEANUP COMPONENT ---
function CanvasCleanup() {
  // Removed aggressive disposal to prevent breaking cached GLTF assets on refresh/navigation.
  // React Three Fiber handles component unmounting cleanup.
  return null;
}

// function Loader() { ... } // Removed in favor of global overlay loading

// Fixed ErrorFallback to use standard HTML since it renders *outside* Canvas
function ErrorFallback() {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      color: '#ff6b6b', fontSize: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '8px', zIndex: 100
    }}>
      <p>Failed to load 3D model</p>
      <p style={{ fontSize: '12px', opacity: 0.7 }}>Please refresh the page</p>
    </div>
  );
}

// Internal ErrorBoundary for 3D content (inside Canvas)
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("3D Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <Html center><div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '10px' }}>3D Error. Check Console.</div></Html>;
    return this.props.children;
  }
}

export default function Simulator() {
  const [plant, setPlant] = useState("tomato");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConditions, setShowConditions] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  const handleModelLoad = () => {
    // Artificial delay to ensure smooth transition and no "pop-in" of assets
    setTimeout(() => setIsLoading(false), 1500);
  };

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

  // Preset values for each condition to instantly visualize them
  const CONDITION_PRESETS = {
    NORMAL: { temperature: 25, humidity: 60, soil_moisture: 50, soil_temperature: 20, light: 1000 },
    HEAT_STRESS: { temperature: 40, humidity: 40, soil_moisture: 40, soil_temperature: 25, light: 1500 },
    COLD_STRESS: { temperature: 8, humidity: 60, soil_moisture: 50, soil_temperature: 10, light: 800 },
    FROST: { temperature: -2, humidity: 40, soil_moisture: 30, soil_temperature: 0, light: 500 },
    HIGH_HUMIDITY: { temperature: 25, humidity: 95, soil_moisture: 60, soil_temperature: 20, light: 800 },
    DROUGHT: { temperature: 30, humidity: 30, soil_moisture: 10, soil_temperature: 25, light: 1500 },
    ROOT_COLD_STRESS: { temperature: 18, humidity: 60, soil_moisture: 50, soil_temperature: 10, light: 800 },
    ROOT_HEAT_STRESS: { temperature: 30, humidity: 50, soil_moisture: 40, soil_temperature: 40, light: 1200 },
    FLOWER_DROP: { temperature: 32, humidity: 30, soil_moisture: 40, soil_temperature: 25, light: 1200 },
    WATERLOGGING: { temperature: 25, humidity: 80, soil_moisture: 95, soil_temperature: 20, light: 800 }
  };

  const applyCondition = (key) => {
    const preset = CONDITION_PRESETS[key];
    if (preset) {
      setControls(prev => ({ ...prev, ...preset }));
      setCorrelationMsg(`Applying ${key.replace(/_/g, ' ')} simulation...`);
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => {
        setCorrelationMsg(null);
        msgTimer.current = null;
      }, 2000);
    }
  };

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


      {/* Main 3D Viewport - Absolute Background */}
      <div className="sim-viewport-wrapper" style={{ background: '#0d1117' }}>
        {hasError ? (
          <ErrorFallback />
        ) : (
          <Canvas
            camera={{ position: [0, 1.5, 6], fov: 55 }}
            shadows
            style={{ width: '100%', height: '100%', background: '#0d1117' }}
            gl={{
              preserveDrawingBuffer: true,
              antialias: true,
              failIfMajorPerformanceCaveat: false,
              logarithmicDepthBuffer: false,
              stencil: false,
              depth: true
            }}

            onCreated={(state) => {
              console.log("Canvas created successfully");
              state.gl.setClearColor('#0d1117');
              const canvas = state.gl.domElement;
              const handleContextLoss = () => {
                console.warn("WebGL context lost on Simulator");
                setHasError(true);
              };
              const handleContextRestoration = () => {
                console.warn("WebGL context restored on Simulator");
                setHasError(false);
              };
              canvas.addEventListener("webglcontextlost", handleContextLoss, false);
              canvas.addEventListener("webglcontextrestored", handleContextRestoration, false);
              return () => {
                canvas.removeEventListener("webglcontextlost", handleContextLoss);
                canvas.removeEventListener("webglcontextrestored", handleContextRestoration);
              };
            }}
          >
            <color attach="background" args={[lighting.bgHex]} />
            <CanvasCleanup />
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

            <ErrorBoundary>
              <Suspense fallback={null}>
                {plant === "tomato" && <ThreeTomato data={controls} onLoad={handleModelLoad} />}
                {plant === "chilli" && <ThreeChilli data={controls} onLoad={handleModelLoad} />}
                {plant === "okra" && <ThreePea data={controls} onLoad={handleModelLoad} />}

                {/* Floor Circle */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                  <circleGeometry args={[10, 64]} />
                  <meshStandardMaterial color="#0a0a0f" roughness={0.6} metalness={0.4} opacity={0.8} transparent />
                </mesh>
              </Suspense>
            </ErrorBoundary>

            {/* Intro Animation -> Control Handoff */}
            {!introFinished && <CameraIntro onFinish={() => setIntroFinished(true)} />}
            <OrbitControls makeDefault enabled={introFinished} />
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

        {/* Conditions Panel Removed from here */}

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

      {/* Independent Horizontal Conditions Dock */}
      <div className={`conditions-dock ${showConditions ? 'expanded' : ''}`}>
        <button
          className="dock-toggle"
          onClick={() => setShowConditions(!showConditions)}
        >
          {showConditions ? 'Close Reference' : 'Health Reference'}
        </button>

        <div className="dock-content">
          <div className="dock-grid">
            <ConditionItem
              color="#2E8B57" label="Normal" desc="Optimal"
              onClick={() => applyCondition("NORMAL")}
              isActive={healthStatus.id === "NORMAL"}
            />
            <ConditionItem
              color="#FF8C00" label="Heat Str." desc=">35°C"
              onClick={() => applyCondition("HEAT_STRESS")}
              isActive={healthStatus.id === "HEAT_STRESS"}
            />
            <ConditionItem
              color="#87CEEB" label="Cold" desc="2-11°C"
              onClick={() => applyCondition("COLD_STRESS")}
              isActive={healthStatus.id === "COLD_STRESS"}
            />
            <ConditionItem
              color="#00BFFF" label="Frost" desc="<1°C"
              onClick={() => applyCondition("FROST")}
              isActive={healthStatus.id === "FROST"}
            />
            <ConditionItem
              color="#708090" label="Humidity" desc=">85%"
              onClick={() => applyCondition("HIGH_HUMIDITY")}
              isActive={healthStatus.id === "HIGH_HUMIDITY"}
            />
            <ConditionItem
              color="#CD853F" label="Drought" desc="<30% Moist"
              onClick={() => applyCondition("DROUGHT")}
              isActive={healthStatus.id === "DROUGHT"}
            />
            <ConditionItem
              color="#4682B4" label="Rt. Cold" desc="<15°C"
              onClick={() => applyCondition("ROOT_COLD_STRESS")}
              isActive={healthStatus.id === "ROOT_COLD_STRESS"}
            />
            <ConditionItem
              color="#A0522D" label="Rt. Heat" desc=">35°C"
              onClick={() => applyCondition("ROOT_HEAT_STRESS")}
              isActive={healthStatus.id === "ROOT_HEAT_STRESS"}
            />
            <ConditionItem
              color="#FFD700" label="Flwr Drop" desc="Hot+Dry"
              onClick={() => applyCondition("FLOWER_DROP")}
              isActive={healthStatus.id === "FLOWER_DROP"}
            />
            <ConditionItem
              color="#2F4F4F" label="Waterlog" desc=">85% Moist"
              onClick={() => applyCondition("WATERLOGGING")}
              isActive={healthStatus.id === "WATERLOGGING"}
            />
          </div>
        </div>
      </div>

      {/* Global Loader Overlay - Covers everything until model is ready */}
      {isLoading && <NatureLoader message="Loading..." />}
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

// Condition display helper
// Condition display helper
function ConditionItem({ color, label, desc, onClick, isActive }) {
  return (
    <div
      className={`condition-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', border: isActive ? `1px solid ${color}` : '1px solid transparent' }}
    >
      <div className="condition-indicator" style={{ backgroundColor: color }} />
      <div className="condition-info">
        <span className="condition-label" style={{ color: isActive ? color : 'rgba(255,255,255,0.9)' }}>{label}</span>
        <span className="condition-desc">{desc}</span>
      </div>
    </div>
  );
}
