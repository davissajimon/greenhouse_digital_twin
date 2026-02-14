import React, { useState, useMemo, Suspense, useEffect, useCallback, useRef } from "react";
import "./Simulator.css";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { Vector3, DoubleSide } from "three";
import { NatureLoader } from "../components/NatureLoader";
import { ThreeTomato } from "../components/ThreeTomato";
import { ThreeChilli } from "../components/ThreeChilli";
import { ThreePea } from "../components/ThreePea";
import { evaluatePlantHealth } from "../utils/PlantHealthEngine";
import { applyEdgeCorrections } from "../utils/SensorCorrelations";
import { weatherToSimulatorState } from "../modules/simulator/geoSimulatorBridge";

/* ── Camera Intro ── */
function CameraIntro({ onFinish }) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(), []);
  useEffect(() => { camera.position.set(10, 3, 10); camera.lookAt(0, -0.5, 0); }, [camera]);
  useFrame((state) => {
    state.camera.position.lerp(target.set(0, 0.4, 5.5), 0.04);
    state.camera.lookAt(0, -0.2, 0);
    if (state.camera.position.distanceTo(target) < 0.1) onFinish();
  });
  return null;
}

/* ── Error Fallback ── */
function ErrorFallback() {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ff6b6b', fontSize: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '8px', zIndex: 100 }}>
      <p>Failed to load 3D model</p><p style={{ fontSize: '12px', opacity: 0.7 }}>Please refresh the page</p>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("3D Error:", error, info); }
  render() {
    if (this.state.hasError) return <Html center><div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '10px' }}>3D Error</div></Html>;
    return this.props.children;
  }
}

/* ── Grow Recommendation ── */
function getGrowRecommendation(plantType, healthStatus, geoWeather) {
  const names = { tomato: 'Tomato', chilli: 'Chilli', okra: 'Okra' };
  const name = names[plantType] || plantType;
  if (!geoWeather) return { type: 'info', emoji: 'ℹ️', title: 'No Location Data', message: `Scroll up to the globe to select a location and analyze growing conditions for ${name}.` };
  const city = geoWeather.cityName || 'Selected location';
  const t = geoWeather.temperature, h = geoWeather.humidity, cond = geoWeather.condition;
  if (healthStatus.id === 'NORMAL') return { type: 'success', emoji: '✅', title: 'Recommended!', message: `${city}'s conditions (${t}°C, ${h}% RH, ${cond}) are suitable for growing ${name}. The plant should thrive here.` };
  if (['FROST', 'HEAT_STRESS'].includes(healthStatus.id)) return { type: 'danger', emoji: '❌', title: 'Not Recommended', message: `${city}'s conditions (${t}°C, ${h}% RH) would cause severe ${healthStatus.label.toLowerCase()} in ${name}. Consider greenhouse growing.` };
  return { type: 'warning', emoji: '⚠️', title: 'Grow with Caution', message: `${city}'s conditions (${t}°C, ${h}% RH, ${cond}) may cause ${healthStatus.label.toLowerCase()} in ${name}. Close monitoring needed.` };
}

/* ══════════════════════════════════════════
   MAIN SIMULATOR
   ══════════════════════════════════════════ */
export default function Simulator({ geoWeather, onReady }) {
  const [plant, setPlant] = useState("tomato");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [introFinished, setIntroFinished] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  /* Controls visibility – hidden until model click */
  const [controlsVisible, setControlsVisible] = useState(false);

  /* Plant info modal */
  const [plantInfoOpen, setPlantInfoOpen] = useState(false);

  const readyFired = useRef(false);
  const fireReady = useCallback(() => {
    if (!readyFired.current && onReady) { readyFired.current = true; onReady(); }
  }, [onReady]);

  const handleModelLoad = () => { setTimeout(() => { setIsLoading(false); fireReady(); }, 4500); };

  useEffect(() => {
    const t = setTimeout(() => { if (isLoading) { console.warn("Loader timeout"); setIsLoading(false); fireReady(); } }, 15000);
    return () => clearTimeout(t);
  }, [isLoading, fireReady]);

  /* Simulator controls */
  const [controls, setControls] = useState({ temperature: 25, humidity: 50, soil_moisture: 45, soil_temperature: 20, light: 500 });
  const [correlationMsg, setCorrelationMsg] = useState(null);
  const msgTimer = useRef(null);

  const showMsg = useCallback((msg, dur = 3000) => {
    setCorrelationMsg(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => { setCorrelationMsg(null); msgTimer.current = null; }, dur);
  }, []);

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
    WATERLOGGING: { temperature: 25, humidity: 80, soil_moisture: 95, soil_temperature: 20, light: 800 },
  };

  const applyCondition = (key) => {
    const p = CONDITION_PRESETS[key];
    if (p) { setControls(prev => ({ ...prev, ...p })); showMsg(`Applying ${key.replace(/_/g, ' ')} …`, 2000); }
  };

  const updateControl = (key, value) => {
    const next = { ...controls, [key]: Number(value) };
    const { newState, adjusted, reasons } = applyEdgeCorrections(next, key);
    setControls(newState);
    if (adjusted) showMsg(reasons[0] || "Adjusting for realism…");
  };

  /* Apply geo weather when it arrives or changes */
  const prevGeoRef = useRef(null);
  useEffect(() => {
    if (geoWeather && geoWeather !== prevGeoRef.current) {
      prevGeoRef.current = geoWeather;
      const simState = weatherToSimulatorState(geoWeather);
      if (simState) {
        queueMicrotask(() => {
          setControls(prev => ({ ...prev, ...simState }));
          showMsg(`🌍 Applied conditions from ${geoWeather.cityName || 'selected location'}`);
        });
      }
    }
  }, [geoWeather, showMsg]);

  /* Click the model → show controls */
  const handlePlantClick = useCallback(() => {
    setControlsVisible(true);
  }, []);

  const healthStatus = useMemo(() => evaluatePlantHealth({ ...controls, species: plant }), [controls, plant]);
  const recommendation = useMemo(() => getGrowRecommendation(plant, healthStatus, geoWeather), [plant, healthStatus, geoWeather]);

  const lighting = useMemo(() => {
    const lux = controls.light, isNight = lux < 200;
    return {
      ambientInt: 0.2 + (lux / 1500) * 0.6,
      dirInt: (lux / 1000) * 2.2,
      sunCol: isNight ? '#88aaff' : '#fff5cc',
      sunPos: isNight ? [-10, 10, -5] : [10, 15, 10],
    };
  }, [controls.light]);

  useEffect(() => { if (hasError) { const t = setTimeout(() => setHasError(false), 3000); return () => clearTimeout(t); } }, [hasError]);

  const scrollToGeo = () => {
    const el = document.getElementById("section-geo");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── JSX ── */
  return (
    <div className="sim-container">

      {/* ═══ THREE.JS VIEWPORT ═══ */}
      <div className="sim-viewport-wrapper">
        {hasError ? <ErrorFallback /> : (
          <Canvas
            camera={{ position: [0, 0.4, 5.5], fov: 50 }}
            shadows
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true, failIfMajorPerformanceCaveat: false, stencil: false, depth: true }}
            onCreated={(state) => {
              state.gl.setClearColor(0x000000, 0);
              const c = state.gl.domElement;
              c.addEventListener("webglcontextlost", () => setHasError(true), false);
              c.addEventListener("webglcontextrestored", () => setHasError(false), false);
            }}
          >
            <ambientLight intensity={lighting.ambientInt} />
            <directionalLight position={lighting.sunPos} intensity={lighting.dirInt} color={lighting.sunCol} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
            <Environment preset="city" background={false} />

            <ErrorBoundary>
              <Suspense fallback={null}>
                {/* Model wrapper — scaled up and pushed lower */}
                <group position={[0, -1.2, 0]} scale={[1.4, 1.4, 1.4]}>
                  {plant === "tomato" && <ThreeTomato data={controls} onLoad={handleModelLoad} />}
                  {plant === "chilli" && <ThreeChilli data={controls} onLoad={handleModelLoad} />}
                  {plant === "okra" && <ThreePea data={controls} onLoad={handleModelLoad} />}
                </group>

                {/* Invisible click target over model */}
                <mesh
                  position={[0, -0.2, -3]}
                  onClick={(e) => { e.stopPropagation(); handlePlantClick(); }}
                  onPointerEnter={() => { document.body.style.cursor = 'pointer'; }}
                  onPointerLeave={() => { document.body.style.cursor = 'default'; }}
                >
                  <cylinderGeometry args={[3, 3, 6, 16]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} side={DoubleSide} />
                </mesh>
              </Suspense>
            </ErrorBoundary>

            {!introFinished && <CameraIntro onFinish={() => setIntroFinished(true)} />}
            <OrbitControls makeDefault enabled={introFinished} maxDistance={10} minDistance={2} />
          </Canvas>
        )}
      </div>

      {/* ═══ "CLICK MODEL" HINT (before panel is opened) ═══ */}
      {!controlsVisible && !isLoading && introFinished && (
        <div className="click-hint">
          <span className="click-hint-icon">👆</span>
          <span>Click the plant to open controls</span>
        </div>
      )}

      {/* ═══ HEALTH BADGE (always visible) ═══ */}
      {!isLoading && introFinished && (
        <div className="health-badge" style={{ '--badge-color': healthStatus.color }}>
          <span className="health-badge-dot" style={{ background: healthStatus.color }} />
          <span>{healthStatus.label}</span>
        </div>
      )}

      {/* ═══ GEO LOCATION TAG (top-left — shows current location) ═══ */}
      {geoWeather && !isLoading && introFinished && (
        <div className="geo-location-tag" onClick={scrollToGeo}>
          <span>📍 {geoWeather.cityName} • {geoWeather.temperature}°C</span>
          <span className="geo-tag-change">Change ↑</span>
        </div>
      )}

      {/* ═══ CONTROLS PANEL (slide-in on model click) ═══ */}
      <div className={`sim-controls-overlay ${controlsVisible ? 'visible' : ''}`}>
        <div className="controls-header">
          <h2>
            Simulation Lab
            {geoWeather && <span className="geo-source-tag">📍 {geoWeather.cityName}</span>}
          </h2>
          <button className="controls-close" onClick={() => setControlsVisible(false)} aria-label="Close controls">✕</button>
        </div>

        <div className="sim-select-group">
          <label>Selected Specimen</label>
          <select value={plant} onChange={(e) => setPlant(e.target.value)} className="sim-dropdown">
            <option value="tomato">Tomato (Solanum lycopersicum)</option>
            <option value="chilli">Chilli (Capsicum annuum)</option>
            <option value="okra">Okra (Abelmoschus esculentus)</option>
          </select>
        </div>

        <div className="sim-status" style={{ borderLeftColor: healthStatus.color }}>
          <span className="status-label">Live Diagnosis</span>
          <span className="status-value" style={{ color: healthStatus.color }}>{healthStatus.label}</span>
          {healthStatus.tip && <span className="status-tip">{healthStatus.tip}</span>}
        </div>

        {correlationMsg && <div className="correlation-msg">ℹ️ {correlationMsg}</div>}

        <div className="sim-slider-group">
          <SliderControl label="Air Temperature" value={controls.temperature} unit="°C" min={-10} max={60} step={0.5} onChange={(v) => updateControl("temperature", v)} />
          <SliderControl label="Relative Humidity" value={controls.humidity} unit="%" min={0} max={100} step={1} onChange={(v) => updateControl("humidity", v)} />
          <SliderControl label="Soil Moisture" value={controls.soil_moisture} unit="%" min={0} max={100} step={1} onChange={(v) => updateControl("soil_moisture", v)} />
          <SliderControl label="Soil Temperature" value={controls.soil_temperature} unit="°C" min={-5} max={45} step={1} onChange={(v) => updateControl("soil_temperature", v)} />
          <SliderControl label="Light Intensity" value={controls.light} unit="lux" min={0} max={2000} step={50} onChange={(v) => updateControl("light", v)} />
        </div>

        {/* Quick presets */}
        <div className="presets-section">
          <button className="dock-toggle" onClick={() => setShowConditions(!showConditions)}>
            {showConditions ? 'Hide Presets ▲' : 'Condition Presets ▼'}
          </button>
          {showConditions && (
            <div className="dock-grid">
              <ConditionItem color="#2E8B57" label="Normal" desc="Optimal" onClick={() => applyCondition("NORMAL")} isActive={healthStatus.id === "NORMAL"} />
              <ConditionItem color="#FF8C00" label="Heat Str." desc=">35°C" onClick={() => applyCondition("HEAT_STRESS")} isActive={healthStatus.id === "HEAT_STRESS"} />
              <ConditionItem color="#87CEEB" label="Cold" desc="2-11°C" onClick={() => applyCondition("COLD_STRESS")} isActive={healthStatus.id === "COLD_STRESS"} />
              <ConditionItem color="#00BFFF" label="Frost" desc="<1°C" onClick={() => applyCondition("FROST")} isActive={healthStatus.id === "FROST"} />
              <ConditionItem color="#708090" label="Humidity" desc=">85%" onClick={() => applyCondition("HIGH_HUMIDITY")} isActive={healthStatus.id === "HIGH_HUMIDITY"} />
              <ConditionItem color="#CD853F" label="Drought" desc="<30% SM" onClick={() => applyCondition("DROUGHT")} isActive={healthStatus.id === "DROUGHT"} />
              <ConditionItem color="#4682B4" label="Root Cold" desc="<15°C" onClick={() => applyCondition("ROOT_COLD_STRESS")} isActive={healthStatus.id === "ROOT_COLD_STRESS"} />
              <ConditionItem color="#A0522D" label="Root Heat" desc=">35°C" onClick={() => applyCondition("ROOT_HEAT_STRESS")} isActive={healthStatus.id === "ROOT_HEAT_STRESS"} />
              <ConditionItem color="#FFD700" label="Flwr Drop" desc="Hot+Dry" onClick={() => applyCondition("FLOWER_DROP")} isActive={healthStatus.id === "FLOWER_DROP"} />
              <ConditionItem color="#2F4F4F" label="Waterlog" desc=">85% SM" onClick={() => applyCondition("WATERLOGGING")} isActive={healthStatus.id === "WATERLOGGING"} />
            </div>
          )}
        </div>

        {/* Plant Info Button */}
        <button className="sim-plant-info-btn" onClick={() => setPlantInfoOpen(true)}>
          🌱 View Plant Analysis
        </button>

        {/* Change Location Button */}
        <button className="sim-change-location-btn" onClick={scrollToGeo}>
          🌍 Change Location
        </button>
      </div>

      {/* ═══ PLANT INFO MODAL ═══ */}
      {plantInfoOpen && (
        <div className="plant-info-backdrop" onClick={() => setPlantInfoOpen(false)}>
          <div className="plant-info-card" onClick={(e) => e.stopPropagation()}>
            <button className="plant-info-close" onClick={() => setPlantInfoOpen(false)}>✕</button>
            <h3>Plant Analysis</h3>
            <div className="plant-info-status" style={{ borderColor: healthStatus.color }}>
              <span className="plant-info-status-dot" style={{ background: healthStatus.color }} />
              <div>
                <span className="plant-info-status-label">{healthStatus.label}</span>
                {healthStatus.tip && <span className="plant-info-status-tip">{healthStatus.tip}</span>}
              </div>
            </div>
            {geoWeather && (
              <div className="plant-info-weather">
                <h4>📍 {geoWeather.cityName} {geoWeather.country}</h4>
                <div className="plant-info-weather-grid">
                  <span>🌡️ {geoWeather.temperature}°C</span>
                  <span>💧 {geoWeather.humidity}%</span>
                  <span>☁️ {geoWeather.condition}</span>
                  <span>💨 {geoWeather.windSpeed} m/s</span>
                </div>
              </div>
            )}
            <div className={`plant-info-recommendation ${recommendation.type}`}>
              <span className="rec-emoji">{recommendation.emoji}</span>
              <div><strong>{recommendation.title}</strong><p>{recommendation.message}</p></div>
            </div>
          </div>
        </div>
      )}

      {isLoading && <NatureLoader message="Loading…" />}
    </div>
  );
}

/* ── Slider Control ── */
function SliderControl({ label, value, unit, min, max, step, onChange }) {
  return (
    <div className="slider-item">
      <div className="slider-header">
        <span>{label}</span>
        <div className="slider-value-group">
          <input type="number" className="sim-number-input" value={value} min={min} max={max} step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            onBlur={(e) => { const v = Math.min(Math.max(Number(e.target.value), min), max); if (v !== Number(e.target.value)) onChange(v); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onChange(Math.min(Math.max(Number(e.currentTarget.value), min), max)); e.currentTarget.blur(); } }}
          />
          <span className="unit">{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/* ── Condition Item ── */
function ConditionItem({ color, label, desc, onClick, isActive }) {
  return (
    <div className={`condition-item ${isActive ? 'active' : ''}`} onClick={onClick}
      style={{ cursor: 'pointer', border: isActive ? `1px solid ${color}` : '1px solid transparent' }}>
      <div className="condition-indicator" style={{ backgroundColor: color }} />
      <div className="condition-info">
        <span className="condition-label" style={{ color: isActive ? color : 'rgba(255,255,255,0.9)' }}>{label}</span>
        <span className="condition-desc">{desc}</span>
      </div>
    </div>
  );
}
