import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import "./Home.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, ContactShadows, useCursor, OrbitControls, Billboard, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import { API_BASE_URL } from "./config";
import { applyEdgeCorrections } from "./utils/SensorCorrelations";
import { evaluatePlantHealth } from "./utils/PlantHealthEngine";


// --- GREENHOUSE ENVIRONMENT ---
// --- GREENHOUSE ENVIRONMENT ---
function Greenhouse({ viewMode }) {
  const glassMaterial = (
    <meshStandardMaterial
      color="#bde0ff"
      roughness={0.1}
      metalness={0.8}
      transparent
      opacity={0.25}
      side={2}
    />
  );
  const frameMaterial = <meshStandardMaterial color="#2c3e50" roughness={0.8} />;

  // Dimensions
  const wallHeight = 5;
  const width = 15.00; // Extended left by 0.23 (14.77 -> 15.00)
  const halfWidth = 7.50;
  const centerX = 0.125; // Shifted left again

  const roofAngle = Math.PI / 6; // 30 degrees
  const roofHeight = halfWidth * Math.tan(roofAngle);
  const roofLength = halfWidth / Math.cos(roofAngle);
  const roofCY = wallHeight + (roofHeight / 2);

  const extension = 2.0; // Unified safe extension for all walls
  const visualHeight = wallHeight + extension;
  const visualY = (wallHeight - extension) / 2;

  // Delay front wall appearance to prevent view blocking during zoom-in
  const [showFrontWall, setShowFrontWall] = useState(false);
  useEffect(() => {
    let timer;
    if (viewMode === 'focus') {
      timer = setTimeout(() => setShowFrontWall(true), 1200); // 1.2s delay for camera travel
    } else {
      setShowFrontWall(false);
    }
    return () => clearTimeout(timer);
  }, [viewMode]);

  return (
    <group position={[-0.1, -1.2, -0.2]} scale={0.95}>
      {/* --- WALLS --- */}
      {/* Back Wall (Glass) - Full */}
      <mesh position={[centerX, visualY, -5]}><boxGeometry args={[width, visualHeight, 0.1]} />{glassMaterial}</mesh>

      {/* Left Wall */}
      <mesh position={[centerX - halfWidth, visualY, 1]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, visualHeight, 0.1]} />{glassMaterial}</mesh>

      {/* Right Wall */}
      <mesh position={[centerX + halfWidth, visualY, 1]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, visualHeight, 0.1]} />{glassMaterial}</mesh>

      {/* --- ROOF --- */}
      {/* Left Slope */}
      <mesh position={[centerX - (halfWidth / 2), roofCY, 1]} rotation={[0, 0, roofAngle]}>
        <boxGeometry args={[roofLength + 0.4, 0.1, 12.4]} />
        {glassMaterial}
      </mesh>
      {/* Right Slope */}
      <mesh position={[centerX + (halfWidth / 2), roofCY, 1]} rotation={[0, 0, -roofAngle]}>
        <boxGeometry args={[roofLength + 0.4, 0.1, 12.4]} />
        {glassMaterial}
      </mesh>

      {/* --- GABLES --- */}
      {/* Back Gable ONLY (Front Open) */}
      <mesh position={[centerX, roofCY, -5]} rotation={[0, - Math.PI / 300, 0]} scale={[1, 1, 0.05]}>
        <coneGeometry args={[halfWidth, roofHeight, 4]} />
        {glassMaterial}
      </mesh>

      {/* Front Wall & Gable (Only in Focus Mode with Delay) */}
      {showFrontWall && (
        <>
          <mesh position={[centerX, visualY, 7]}><boxGeometry args={[width, visualHeight, 0.1]} />{glassMaterial}</mesh>
          <mesh position={[centerX, roofCY, 7]} rotation={[0, -Math.PI / 300, 0]} scale={[1, 1, 0.05]}>
            <coneGeometry args={[halfWidth, roofHeight, 4]} />
            {glassMaterial}
          </mesh>
        </>
      )}



      {/* --- FRAMES --- */}
      {/* Back Corners */}
      <mesh position={[centerX - halfWidth, visualY, -5]}><boxGeometry args={[0.3, visualHeight, 0.3]} />{frameMaterial}</mesh>
      <mesh position={[centerX + halfWidth, visualY, -5]}><boxGeometry args={[0.3, visualHeight, 0.3]} />{frameMaterial}</mesh>

      {/* Front Corners (Support for roof only, no wall) */}
      <mesh position={[centerX - halfWidth, visualY, 7]}><boxGeometry args={[0.3, visualHeight, 0.3]} />{frameMaterial}</mesh>
      <mesh position={[centerX + halfWidth, visualY, 7]}><boxGeometry args={[0.3, visualHeight, 0.3]} />{frameMaterial}</mesh>
    </group>
  );
}

// --- CONFIG ---
const PLANTS = [
  { id: 'chilli', name: 'Chilli', Component: ThreeChilli, xPos: -4.5, focusZ: 4.5, focusY: 1.0 },
  { id: 'tomato', name: 'Tomato', Component: ThreeTomato, xPos: 0, focusZ: 5.5, focusY: 1.2 }, // Central hero plant
  { id: 'okra', name: 'Okra', Component: ThreePea, xPos: 4.5, focusZ: 4.5, focusY: 1.0 }
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
function CameraController({ viewMode, activePlantConfig, userInteracting }) {
  // Reset interaction flag when target changes so animation takes over
  useEffect(() => {
    if (userInteracting) userInteracting.current = false;
  }, [viewMode, activePlantConfig, userInteracting]);

  useFrame((state) => {
    // If user is interacting, stop auto-adjustment to prevent fighting/bouncing
    if (userInteracting && userInteracting.current) return;

    // Safety check
    if (!activePlantConfig && viewMode !== 'overview') return;

    // Determine target based on mode
    // Overview: Close enough to see all (Z=6)
    // Focus: Zoomed in for detail, use plant-specific Z if available
    const focusZ = activePlantConfig?.focusZ || 3.5;
    const targetCamZ = viewMode === 'overview' ? 12 : focusZ;
    const targetCamPos = viewMode === 'overview'
      ? new THREE.Vector3(0, 2.0, targetCamZ)
      : new THREE.Vector3(activePlantConfig?.xPos || 0, 0.8, targetCamZ);

    // LookAt Target (Orbit Pivot)
    const focusY = activePlantConfig?.focusY || 0.5;
    const targetLookAt = viewMode === 'overview'
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(activePlantConfig?.xPos || 0, focusY, 0);

    // 1. Move Camera Position - Higher factor (0.15) for faster, snappy transition
    state.camera.position.lerp(targetCamPos, 0.15);

    // 2. Move OrbitControls Target if it exists
    if (state.controls && state.controls.target) {
      state.controls.target.lerp(targetLookAt, 0.15);
    } else {
      // Fallback
      state.camera.lookAt(targetLookAt);
    }
  });
  return null;
}

const HologramData = ({ data, title, health }) => (
  <div className="hologram-panel" style={{ borderColor: health?.color || '#2E8B57' }}>
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
    <div className="holo-footer" style={{ color: health?.color || '#2E8B57' }}>
      STATUS: {health?.label.toUpperCase() || 'OPTIMAL'}
    </div>
  </div>
);

function PlantItem({ ItemConfig, index, isActive, isFocused, onClick, sensorId, onDataUpdate }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const Component = ItemConfig.Component;

  // Independent Data Fetching for this specific plant
  const { data: apiData, status, error } = useFetchSensorData(ItemConfig.id, sensorId);

  // Process data (Physics fixes etc)
  const sensorData = useMemo(() => {
    if (!apiData) return null;
    const raw = {
      temperature: apiData.temperature,
      humidity: apiData.humidity,
      soil_moisture: apiData.soil_moisture,
      soil_temperature: apiData.soil_temperature
    };
    const { newState } = applyEdgeCorrections(raw, null);
    return newState;
  }, [apiData]);

  // Bubble up data to Home if this is the active plant
  useEffect(() => {
    if (isActive && onDataUpdate) {
      onDataUpdate({ data: sensorData, status, error });
    }
  }, [isActive, sensorData, status, error, onDataUpdate]);

  return (
    <group
      position={[ItemConfig.xPos, -0.32, 0.05]}
      onClick={(e) => { e.stopPropagation(); onClick(index); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Component data={{ ...sensorData, species: ItemConfig.id }} />

      {/* Label Chip (Always visible unless focused) */}
      {!isFocused && (
        <Html position={[0, 3.6, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
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
        <Billboard position={[0.9, 0.8, 0]} follow={true}>
          <Html position={[0, 0, 0]} center rotateZ={0} distanceFactor={1.2} transform>
            <HologramData
              data={sensorData}
              title={ItemConfig.name}
              health={evaluatePlantHealth({ ...sensorData, species: ItemConfig.id })}
            />
          </Html>
        </Billboard>
      )}
    </group>
  );
}

// --- UI COMPONENTS ---

import { useNavigate } from "react-router-dom";

function Sidebar({ visible, plant, onClose, apiState, currentSensorId, onUpdateSensorId }) {
  const [species, setSpecies] = useState(plant?.name || "");
  const [sensorIdInput, setSensorIdInput] = useState(currentSensorId || "");
  const navigate = useNavigate();

  useEffect(() => {
    if (plant) setSpecies(plant.name);
    // When plant changes or currentSensorId updates from outside, update local input
    setSensorIdInput(currentSensorId || "");
  }, [plant, currentSensorId]);

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
            <div className="tips-box" style={{ borderLeftColor: apiState.health?.color || '#2e8b57' }}>
              <p><strong>Condition:</strong> {apiState.health?.label || 'Normal'}</p>
              <p style={{ marginTop: '8px', opacity: 0.8 }}>
                {apiState.health?.id === 'NORMAL'
                  ? "System optimal. No intervention required."
                  : "Anomaly detected. Check environmental controls."}
              </p>
              <div className="tip-alert" style={{ color: apiState.health?.color || '#2e8b57' }}>
                ! Protocol: {apiState.health?.id === 'NORMAL' ? 'Monitoring' : 'INTERVENTION'}
              </div>
            </div>
          </div>

          <div className="data-group">
            <h3>Connection Settings</h3>
            <input className="input-field" placeholder="Species Name" value={species} readOnly style={{ opacity: 0.7 }} />
            <input
              className="input-field"
              placeholder="Sensor ID"
              value={sensorIdInput}
              onChange={(e) => setSensorIdInput(e.target.value)}
            />
            <button
              className={`connect-btn ${apiState.isFetching ? 'active' : ''}`}
              onClick={() => onUpdateSensorId(plant.id, sensorIdInput)}
            >
              {apiState.isFetching ? 'Refresh / Update Stream' : 'Connect Sensor Stream'}
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

import { useFetchSensorData } from "./hooks/useFetchSensorData";






function Floor() {
  const { scene } = useGLTF("/grassbase.glb");
  const concreteMap = useTexture("detailed_ground_texture.png");

  // Clone grass model
  const clone = useMemo(() => scene.clone(), [scene]);

  // Configure concrete texture
  const concreteTexture = useMemo(() => {
    const t = concreteMap.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    t.anisotropy = 16;
    t.needsUpdate = true;
    return t;
  }, [concreteMap]);

  return (
    <group>
      {/* Outside Grass Terrain */}
      <primitive
        object={clone}
        position={[0, -0.15, 0]}
        scale={[2.2, 2.2, 2.2]}
      />

      {/* Inside Concrete Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.025, -0.28, 0.4875]} receiveShadow>
        <planeGeometry args={[14.00, 10.675]} />
        <meshStandardMaterial
          map={concreteTexture}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Front Vertical Wall (Foundation Edge) */}
      <mesh rotation={[0, 0, 0]} position={[0.025, -1.03, 5.825]} receiveShadow>
        <planeGeometry args={[14.00, 1.5]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Back Vertical Wall */}
      <mesh rotation={[0, Math.PI, 0]} position={[0.025, -1.03, -4.85]} receiveShadow>
        <planeGeometry args={[14.00, 1.5]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Left Vertical Wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[-6.975, -1.03, 0.4875]} receiveShadow>
        <planeGeometry args={[10.675, 1.5]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Right Vertical Wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[7.025, -1.03, 0.4875]} receiveShadow>
        <planeGeometry args={[10.675, 1.5]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(1);
  const userInteracting = useRef(false);
  const [viewMode, setViewMode] = useState('overview');

  // Independent sensor mapping: plant.id -> sensorId
  const [sensorMap, setSensorMap] = useState({
    tomato: "1",
    chilli: "2",
    okra: "3"
  });

  // Data from the currently ACTIVE plant (for Sidebar display)
  const [activePlantData, setActivePlantData] = useState({ data: null, status: 'idle', error: null });

  const handlePlantClick = (index) => { setActiveIndex(index); setViewMode('focus'); };
  const handleNext = () => { setActiveIndex((prev) => (prev + 1) % PLANTS.length); };
  const handlePrev = () => { setActiveIndex((prev) => (prev - 1 + PLANTS.length) % PLANTS.length); };
  const handleCloseFocus = () => { setViewMode('overview'); };

  // Data Update Handler from PlantItems
  const handleDataUpdate = (fetchedInfo) => {
    setActivePlantData(fetchedInfo);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (viewMode === 'overview') return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') { setViewMode('overview'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'focus') {
      document.body.classList.add('home-focus-mode');
    } else {
      document.body.classList.remove('home-focus-mode');
    }
    return () => document.body.classList.remove('home-focus-mode');
  }, [viewMode]);

  const updateSensorId = (plantId, newId) => {
    setSensorMap(prev => ({
      ...prev,
      [plantId]: newId
    }));
  };

  // Derive active health state for Sidebar
  const activePlantHealth = useMemo(() => {
    if (!activePlantData.data) return null;
    return evaluatePlantHealth({ ...activePlantData.data, species: PLANTS[activeIndex].id });
  }, [activePlantData.data, activeIndex]);

  const sidebarApiState = {
    isFetching: activePlantData.status === 'loading' || activePlantData.status === 'success',
    data: activePlantData.data,
    error: activePlantData.error,
    health: activePlantHealth
  };

  return (
    <div className="app-layout" style={{ height: 'calc(100vh - 64px)' }}>
      <Canvas
        className="webgl-canvas"
        shadows="soft"
        dpr={[1, 1.5]} // Clamp pixel ratio for performance
        camera={{ position: [0, 4, 12], fov: 45, near: 0.1, far: 50 }} // Tight frustum with Initial Backward Position
        gl={{ powerPreference: "high-performance", antialias: false }} // Optimize context
      >
        <color attach="background" args={['#101827']} />

        <ambientLight intensity={1.0} />
        {/* Fill light, no shadows */}
        <pointLight position={[0, 5, 5]} intensity={3} distance={15} decay={2} castShadow={false} />
        {/* Main Key Light */}
        <directionalLight
          position={[5, 8, 5]}
          intensity={2}
          castShadow
          shadow-mapSize={[1024, 1024]} // Optimize shadow map
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <Environment preset="city" />

        {/* Interactive Controls */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.1}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={2}            // Allow zooming in close
          maxDistance={14}           // Restrict zooming out too far (floor edges)
          minAzimuthAngle={viewMode === 'focus' ? -Infinity : -Math.PI / 4}
          maxAzimuthAngle={viewMode === 'focus' ? Infinity : Math.PI / 4}
          onStart={() => { userInteracting.current = true; }}
        />

        {/* Dynamic Camera with Error Boundary */}
        <ErrorBoundary>
          <CameraController
            viewMode={viewMode}
            activePlantConfig={PLANTS[activeIndex]}
            userInteracting={userInteracting}
          />
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
                sensorId={sensorMap[plant.id]}
                onDataUpdate={handleDataUpdate}
              />
            ))}
            {/* Soil Floor */}
            <Floor />
            <Greenhouse viewMode={viewMode} />
            <ContactShadows resolution={256} scale={20} blur={2.5} opacity={0.5} far={10} />
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
        apiState={sidebarApiState}
        currentSensorId={sensorMap[PLANTS[activeIndex].id]}
        onUpdateSensorId={updateSensorId}
      />
    </div>
  );
}
