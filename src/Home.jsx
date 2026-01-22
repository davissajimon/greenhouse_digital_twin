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

function CameraController({ viewMode, targetX }) {
  useFrame((state) => {
    // Safety check
    if (typeof targetX !== 'number') return;

    // Determine target based on mode
    // Overview: Close enough to see all (Z=6)
    // Focus: Zoomed in for detail (Z=2.5)
    // Note: Since we use OrbitControls, we shouldn't fight its position blindly,
    // but for the transition "lerp", we apply forces.

    const targetCamZ = viewMode === 'overview' ? 6 : 2.5;
    const targetCamPos = viewMode === 'overview'
      ? new THREE.Vector3(0, 2, targetCamZ)
      : new THREE.Vector3(targetX, 1, targetCamZ);

    // LookAt Target (Orbit Pivot)
    const targetLookAt = viewMode === 'overview'
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(targetX, 0.5, 0);

    // 1. Move Camera Position
    state.camera.position.lerp(targetCamPos, 0.25);

    // 2. Move OrbitControls Target if it exists
    if (state.controls && state.controls.target) {
      state.controls.target.lerp(targetLookAt, 0.25);
    } else {
      // Fallback
      state.camera.lookAt(targetLookAt);
    }
  });
  return null;
}

function PlantItem({ ItemConfig, index, isActive, isFocused, onClick }) {
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
      <Component />
      <Html position={[0, 2.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div
          className="plant-label-chip"
          style={{
            opacity: (hovered || (isActive && isFocused)) ? 1 : 0.6,
            transform: `scale(${(isActive && isFocused) ? 1.2 : 1})`
          }}
        >
          {ItemConfig.name}
        </div>
      </Html>
    </group>
  );
}

// --- UI COMPONENTS ---

function Sidebar({ visible, plant, onClose, apiState, onConnect }) {
  const [species, setSpecies] = useState(plant?.name || "");
  const [sensorId, setSensorId] = useState("");

  useEffect(() => {
    if (plant) setSpecies(plant.name);
  }, [plant]);

  return (
    <div className={`sidebar-panel ${visible ? 'visible' : ''}`}>
      <button className="close-btn" onClick={onClose}>&times;</button>
      {plant && (
        <>
          <div className="sidebar-header">
            <h2>{plant.name}</h2>
            <div className="subtitle">Unit ID: {plant.id.toUpperCase()}_01</div>
          </div>
          <div className="data-group">
            <h3>Live Sensor Data</h3>
            <div className="value-grid">
              <div className="value-card"><label>Temperature</label><div className="val">{apiState.data?.temperature || 24}°C</div></div>
              <div className="value-card"><label>Humidity</label><div className="val">{apiState.data?.humidity || 60}%</div></div>
              <div className="value-card"><label>Soil Moisture</label><div className="val">{apiState.data?.soil || 45}%</div></div>
              <div className="value-card"><label>Health</label><div className="val" style={{ color: '#4caf50' }}>Good</div></div>
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
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button style={{
              background: 'transparent', border: '1px solid #444', color: '#888', width: '100%', padding: '12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
            }} onClick={() => window.location.href = '/scalability'}
              onMouseOver={(e) => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff' }}
              onMouseOut={(e) => { e.target.style.borderColor = '#444'; e.target.style.color = '#888' }}
            >
              View Scalability Test &rarr;
            </button>
            <button style={{
              background: 'transparent', border: '1px solid #444', color: '#888', width: '100%', padding: '12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
            }} onClick={() => window.location.href = '/Sim'}
              onMouseOver={(e) => { e.target.style.borderColor = '#888'; e.target.style.color = '#fff' }}
              onMouseOut={(e) => { e.target.style.borderColor = '#444'; e.target.style.color = '#888' }}
            >
              Open Lab Simulator &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [viewMode, setViewMode] = useState('overview');
  const [apiState, setApiState] = useState({ isFetching: false, data: null, error: null });
  const [connectionParams, setConnectionParams] = useState({ species: '', id: '' });

  const handlePlantClick = (index) => { setActiveIndex(index); setViewMode('focus'); };
  const handleNext = () => { setActiveIndex((prev) => (prev + 1) % PLANTS.length); };
  const handlePrev = () => { setActiveIndex((prev) => (prev - 1 + PLANTS.length) % PLANTS.length); };
  const handleCloseFocus = () => { setViewMode('overview'); };

  useEffect(() => {
    const handleKey = (e) => {
      if (viewMode === 'overview') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setViewMode('overview');
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
            temperature: json.universal?.room_temperature || 0,
            humidity: json.universal?.room_humidity || 0,
            soil: json.plant?.soil_moisture || 0
          }
        }));
      } catch (e) { console.warn(e); }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => clearInterval(interval);
  }, [apiState.isFetching, connectionParams]);

  return (
    <div className="app-layout">
      <Canvas className="webgl-canvas" shadows dpr={1}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <Environment preset="night" />

        {/* Interactive Controls */}
        <OrbitControls makeDefault enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />

        {/* Dynamic Camera with Error Boundary */}
        <ErrorBoundary>
          <CameraController viewMode={viewMode} targetX={PLANTS[activeIndex].xPos} />
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
              />
            ))}
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial color="#111" roughness={0.6} />
            </mesh>
            <gridHelper args={[50, 50, '#333', '#111']} />
            <Greenhouse />
            <ContactShadows resolution={512} scale={20} blur={2.5} opacity={0.5} far={10} />
          </ErrorBoundary>
        </Suspense>
      </Canvas>

      <div className="visual-header">
        <h2>Greenhouse Twin</h2>
        <div className="indicators">
          <div className="ind">Interactive Mode</div>
          {apiState.isFetching && <div className="ind" style={{ color: '#4caf50' }}>● Live</div>}
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
