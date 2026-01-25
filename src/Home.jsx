import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import "./Home.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, ContactShadows, useCursor, OrbitControls } from "@react-three/drei";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import { API_BASE_URL } from "./config";


// --- GREENHOUSE ENVIRONMENT ---
function Greenhouse() {
  const glassMaterial = (
    <meshPhysicalMaterial
      color="#bde0ff"
      transmission={0.4}
      roughness={0.1}
      metalness={0.1}
      transparent
      opacity={0.2}
      side={2}
    />
  );
  const frameMaterial = <meshStandardMaterial color="#2c3e50" roughness={0.8} />;

  return (
    <group position={[0, -1, 0]}>
      {/* Structure */}
      <mesh position={[0, 2.5, -5]} receiveShadow castShadow><boxGeometry args={[14, 5, 0.2]} />{glassMaterial}</mesh>
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[10, 5, 0.2]} />{glassMaterial}</mesh>
      <mesh position={[7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[10, 5, 0.2]} />{glassMaterial}</mesh>
      <mesh position={[-3.5, 6, 0]} rotation={[0, 0, Math.PI / 6]}><boxGeometry args={[8, 0.2, 10]} />{glassMaterial}</mesh>
      <mesh position={[3.5, 6, 0]} rotation={[0, 0, -Math.PI / 6]}><boxGeometry args={[8, 0.2, 10]} />{glassMaterial}</mesh>

      {/* Frames */}
      <mesh position={[-7, 2.5, 5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[7, 2.5, 5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[-7, 2.5, -5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[7, 2.5, -5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
    </group>
  );
}

// --- CONFIG ---
const PLANTS = [
  { id: 'chilli', name: 'Chilli', Component: ThreeChilli, xPos: -3 },
  { id: 'tomato', name: 'Tomato', Component: ThreeTomato, xPos: 0 },
  { id: 'pea', name: 'Pea', Component: ThreePea, xPos: 3 }
];

// --- 3D COMPONENTS ---

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("3D Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <Html center><div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '10px' }}>3D Error. Check Console.</div></Html>;
    return this.props.children;
  }
}

// Camera Controller Component
function CameraController({ viewMode, targetX, userInteracting }) {
  // Reset interaction flag when target changes so animation takes over
  useEffect(() => {
    if (userInteracting) userInteracting.current = false;
  }, [viewMode, targetX, userInteracting]);

  useFrame((state) => {
    // If user is interacting, stop auto-adjustment to prevent fighting/bouncing
    if (userInteracting && userInteracting.current) return;

    // Safety check
    if (typeof targetX !== 'number') return;

    // Determine target based on mode
    // Overview: Close enough to see all (Z=6)
    // Focus: Zoomed in for detail, increased Z to 3.5 to prevent distortion
    const targetCamZ = viewMode === 'overview' ? 3.8 : 3.5;
    const targetCamPos = viewMode === 'overview'
      ? new THREE.Vector3(0, 2.0, targetCamZ)
      : new THREE.Vector3(targetX, 0.8, targetCamZ);

    // LookAt Target (Orbit Pivot)
    const targetLookAt = viewMode === 'overview'
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(targetX, 0.5, 0);

    // 1. Move Camera Position - Lower factor (0.05) for slower, smoother transition
    state.camera.position.lerp(targetCamPos, 0.05);

    // 2. Move OrbitControls Target if it exists
    if (state.controls && state.controls.target) {
      state.controls.target.lerp(targetLookAt, 0.05);
    } else {
      // Fallback
      state.camera.lookAt(targetLookAt);
    }
  });
  return null;
}

const HologramData = ({ data, title }) => (
  <div className="hologram-panel">
    <div className="holo-header">{title}</div>
    <div className="holo-grid">
      <div className="holo-item">
        <span className="holo-label">AIR TEMP</span>
        <span className="holo-value">{data?.temperature || 24}<small>°C</small></span>
      </div>
      <div className="holo-item">
        <span className="holo-label">HUMIDITY</span>
        <span className="holo-value">{data?.humidity || 60}<small>%</small></span>
      </div>
      <div className="holo-item">
        <span className="holo-label">SOIL MOIST</span>
        <span className="holo-value">{data?.soil_moisture || 45}<small>%</small></span>
      </div>
      <div className="holo-item">
        <span className="holo-label">SOIL TEMP</span>
        <span className="holo-value">{data?.soil_temperature || 20}<small>°C</small></span>
      </div>
    </div>
    <div className="holo-footer">STATUS: OPTIMAL</div>
  </div>
);

function PlantItem({ ItemConfig, index, isActive, isFocused, onClick, sensorData }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const Component = ItemConfig.Component;

  return (
    <group
      position={[ItemConfig.xPos, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(index); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Component data={sensorData} />

      {/* Label Chip (Always visible unless focused) */}
      {!isFocused && (
        <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div
            className="plant-label-chip"
            style={{
              opacity: hovered ? 1 : 0.6,
              transform: `scale(${hovered ? 1.1 : 1})`
            }}
          >
            {ItemConfig.name}
          </div>
        </Html>
      )}

      {/* Hologram View (Only when Focused) */}
      {isActive && isFocused && (
        <Html position={[0.9, 0.8, 0]} center rotateZ={0} distanceFactor={1.2} transform>
          <HologramData data={sensorData} title={ItemConfig.name} />
        </Html>
      )}
    </group>
  );
}

// --- UI COMPONENTS ---

import { useNavigate } from "react-router-dom";

function Sidebar({ visible, plant, onClose, apiState, onConnect }) {
  const [species, setSpecies] = useState(plant?.name || "");
  const [sensorId, setSensorId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (plant) setSpecies(plant.name);
  }, [plant]);

  return (
    <div className={`sidebar-panel glass-panel ${visible ? 'visible' : ''}`}>
      <button className="close-btn" onClick={onClose}>&times;</button>
      {plant && (
        <>
          <div className="sidebar-header">
            <h2>{plant.name}</h2>
          </div>

          <div className="data-group">
            <h3>Diagnostic Tips</h3>
            <div className="tips-box">
              <p><strong>Condition:</strong> Normal</p>
              <p style={{ marginTop: '8px', opacity: 0.8 }}>No issues detected. Maintain current irrigation and lighting schedules.</p>
              <div className="tip-alert">! Protocol: Monitoring Active</div>
            </div>
          </div>

          <div className="data-group">
            <h3>Connection Settings</h3>
            <input className="input-field" placeholder="Species Name" value={species} onChange={(e) => setSpecies(e.target.value)} />
            <input className="input-field" placeholder="Sensor ID" value={sensorId} onChange={(e) => setSensorId(e.target.value)} />
            <button className={`connect-btn ${apiState.isFetching ? 'active' : ''}`} onClick={() => onConnect(species, sensorId)}>
              {apiState.isFetching ? 'Disconnect Stream' : 'Connect Sensor Stream'}
            </button>
            {apiState.error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '10px' }}>{apiState.error}</p>}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <button style={{
              background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff', width: '100%', padding: '12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(4px)'
            }} onClick={() => navigate('/Sim')}
              onMouseOver={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.2)'; }}
              onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            >
              Open Lab Simulator &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home({ setNavVisible }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const userInteracting = useRef(false);
  const [viewMode, setViewMode] = useState('overview');
  const [apiState, setApiState] = useState({ isFetching: false, data: null, error: null });
  const [connectionParams, setConnectionParams] = useState({ species: '', id: '' });

  const handlePlantClick = (index) => { setActiveIndex(index); setViewMode('focus'); setNavVisible(false); };
  const handleNext = () => { setActiveIndex((prev) => (prev + 1) % PLANTS.length); };
  const handlePrev = () => { setActiveIndex((prev) => (prev - 1 + PLANTS.length) % PLANTS.length); };
  const handleCloseFocus = () => { setViewMode('overview'); setNavVisible(true); };

  useEffect(() => {
    const handleKey = (e) => {
      if (viewMode === 'overview') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') { setViewMode('overview'); setNavVisible(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewMode]);

  const toggleConnection = (species, id) => {
    if (apiState.isFetching) {
      setApiState(s => ({ ...s, isFetching: false, data: null }));
    } else {
      if (!species || !id) { setApiState(s => ({ ...s, error: "Please enter Species and ID" })); return; }
      setConnectionParams({ species, id });
      setApiState(s => ({ ...s, isFetching: true, error: null }));
    }
  };

  useEffect(() => {
    if (!apiState.isFetching) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get_data/${connectionParams.species}/${connectionParams.id}`);
        if (!res.ok) throw new Error("Stream Failed");
        const json = await res.json();
        setApiState(s => ({
          ...s,
          data: {
            room_temperature: json.universal?.room_temperature || 0,
            room_humidity: json.universal?.room_humidity || 0,
            light_intensity: json.universal?.light_intensity || 0,
            air_quality: json.universal?.air_quality || 0,
            soil_moisture: json.plant?.soil_moisture || 0,
            soil_temperature: json.plant?.temperature || 0
          }
        }));
      } catch (e) { console.warn(e); }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => clearInterval(interval);
  }, [apiState.isFetching, connectionParams]);

  // Transform api data for 3D components
  const sensorData = apiState.data ? {
    temperature: apiState.data.room_temperature,
    humidity: apiState.data.room_humidity,
    soil_moisture: apiState.data.soil_moisture,
    soil_temperature: apiState.data.soil_temperature
  } : null;

  return (
    <div className="app-layout" style={{ height: 'calc(100vh - 64px)' }}>
      <Canvas className="webgl-canvas" shadows dpr={1}>
        <color attach="background" args={['#101827']} />

        <ambientLight intensity={1.5} />
        <pointLight position={[0, 5, 5]} intensity={5} distance={20} decay={2} />
        <directionalLight position={[5, 10, 5]} intensity={3} castShadow />
        <Environment preset="city" />

        {/* Interactive Controls */}
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          onStart={() => { userInteracting.current = true; }}
        />

        {/* Dynamic Camera with Error Boundary */}
        <ErrorBoundary>
          <CameraController viewMode={viewMode} targetX={PLANTS[activeIndex].xPos} userInteracting={userInteracting} />
        </ErrorBoundary>

        <Suspense fallback={null}>
          <ErrorBoundary>
            {PLANTS.map((plant, i) => (
              <PlantItem
                key={plant.id}
                index={i}
                ItemConfig={plant}
                isActive={i === activeIndex}
                isFocused={viewMode === 'focus'}
                onClick={handlePlantClick}
                sensorData={sensorData}
              />
            ))}
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#020202" roughness={0.6} />
            </mesh>
            <gridHelper args={[50, 50, '#333', '#111']} />
            <Greenhouse />
            <ContactShadows resolution={512} scale={20} blur={2.5} opacity={0.5} far={10} />
          </ErrorBoundary>
        </Suspense>
      </Canvas>

      <div className={`hero-overlay cinematic-fade-enter ${viewMode === 'focus' ? 'hidden' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">AUTOMATION REIMAGINED</div>
          <h1 className="text-hero">DIGITAL TWIN<br />GREENHOUSE</h1>
          <p className="text-sub">
            A living ecosystem simulated in real-time.
            <br />
            Experience the future of sustainable agriculture.
          </p>
        </div>

        <div className="hero-controls">
          <div className="scroll-indicator">
            <span className="scroll-text">INTERACTIVE VIEW</span>
            <div className="scroll-line"></div>
          </div>
        </div>
      </div>

      {viewMode === 'focus' && (
        <>
          <button className="nav-btn prev" onClick={handlePrev}>&larr;</button>
          <button className="nav-btn next" onClick={handleNext}>&rarr;</button>
        </>
      )}

      <Sidebar
        visible={viewMode === 'focus'}
        plant={PLANTS[activeIndex]}
        onClose={handleCloseFocus}
        apiState={apiState}
        onConnect={toggleConnection}
      />
    </div>
  );
}
