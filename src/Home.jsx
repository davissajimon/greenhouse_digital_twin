import React, { useState, useEffect, Suspense, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Html } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";

import { evaluatePlantHealth } from "./utils/PlantHealthEngine";

function SensorCard({ data }) {
  if (!data) return null;
  const health = evaluatePlantHealth(data);

  return (
    <div className="sensor-card-home-overlay" style={{ borderColor: health.color, boxShadow: `0 8px 32px ${health.color}33` }}>
      <div className="card-header">
        <h2>{data.name || "Unknown Plant"}</h2>
        <div style={{
          fontSize: '0.9rem',
          color: health.color,
          fontWeight: 'bold',
          marginTop: '4px'
        }}>
          {health.label.toUpperCase()}
        </div>
      </div>
      <div className="card-grid">
        <div className="card-item">
          <span className="label">Temp</span>
          <span className="value">{data.temperature}°C</span>
        </div>
        <div className="card-item">
          <span className="label">Humidity</span>
          <span className="value">{data.humidity}%</span>
        </div>
        <div className="card-item">
          <span className="label">Soil Moisture</span>
          <span className="value">{data.soil_moisture}%</span>
        </div>
        <div className="card-item">
          <span className="label">Soil Temp</span>
          <span className="value">{data.soil_temperature}°C</span>
        </div>
        <div className="card-item">
          <span className="label">Light</span>
          <span className="value">{data.light} PAR</span>
        </div>
        <div className="card-item">
          <span className="label">Air Qual</span>
          <span className="value">{data.air_quality} AQI</span>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return <Html center><div style={{ color: "white" }}>Loading Plants...</div></Html>;
}

// Wrapper for interactive plant
function PlantGroup({ position, scale, label, onHover, onLeave, onClick, children }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  // Basic manual lerp for smoothness could be done here with useFrame, 
  // but for simplicity we rely on React re-render. 
  // Adding CSS transition to canvas isn't possible, 
  // so we accept instant snap or use @react-spring/three if available (not requested to install).

  return (
    <group
      ref={ref}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onLeave(); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Selection Ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 32]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : "#ffffff"} transparent opacity={hovered ? 0.8 : 0.0} />
      </mesh>

      {children}

      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}

// --- GREENHOUSE ENVIRONMENT COMPONENT ---
function Greenhouse() {
  const glassMaterial = (
    <meshPhysicalMaterial
      color="#bde0ff"
      transmission={0.4}
      roughness={0.1}
      metalness={0.1}
      transparent
      opacity={0.3}
      side={2} // DoubleSide
    />
  );

  const frameMaterial = <meshStandardMaterial color="#2c3e50" roughness={0.8} />;

  return (
    <group position={[0, -1, 0]}> {/* Base everything at y=-1 so plants sit on floor */}

      {/* 1. Floor (Concrete/Ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#707070" roughness={0.8} />
      </mesh>

      {/* 2. Glass Structure (Approx 14 wide, 10 deep, 5 high) */}

      {/* Back Wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow castShadow>
        <boxGeometry args={[14, 5, 0.2]} />
        {glassMaterial}
      </mesh>

      {/* Side Walls */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 5, 0.2]} />
        {glassMaterial}
      </mesh>
      <mesh position={[7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 5, 0.2]} />
        {glassMaterial}
      </mesh>

      {/* Roof (Simple triangular prism vibe using two rotated planes) */}
      {/* Left Roof Plane */}
      <mesh position={[-3.5, 6, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[8, 0.2, 10]} />
        {glassMaterial}
      </mesh>
      {/* Right Roof Plane */}
      <mesh position={[3.5, 6, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[8, 0.2, 10]} />
        {glassMaterial}
      </mesh>

      {/* Simple Frames/Beams (Optional but adds realism) */}
      <mesh position={[-7, 2.5, 5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[7, 2.5, 5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[-7, 2.5, -5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>
      <mesh position={[7, 2.5, -5]}><boxGeometry args={[0.4, 5, 0.4]} />{frameMaterial}</mesh>

    </group>
  );
}

export default function Home() {
  const [plantsData, setPlantsData] = useState([]);
  const [activePlantId, setActivePlantId] = useState("tomato"); // 'chilli', 'tomato', 'pea'
  const [hoveredPlantId, setHoveredPlantId] = useState(null);
  const navigate = useNavigate();

  // Poll backend
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sensors/all');
        if (!res.ok) throw new Error("Backend not reachable");
        const data = await res.json();
        setPlantsData(data.plants || []);
      } catch (err) {
        // Fallback mock data if backend isn't running yet (dx convenience)
        console.warn("Using fallback data", err);
        setPlantsData([
          { plant_id: "chilli", name: "Chilli", temperature: 24, humidity: 60, soil_moisture: 40, light: 500, air_quality: 100 },
          { plant_id: "tomato", name: "Tomato", temperature: 26, humidity: 55, soil_moisture: 35, light: 600, air_quality: 120 },
          { plant_id: "pea", name: "Pea", temperature: 22, humidity: 65, soil_moisture: 45, light: 450, air_quality: 90 }
        ]);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 2000);
    return () => clearInterval(interval);
  }, []);

  const getPlantData = (id) => plantsData.find(p => p.plant_id === id) || {};

  // Config for Carousel
  // Order: Chilli -> Tomato -> Pea -> Chilli
  // If Tomato Active: Chilli (L), Tomato (C), Pea (R)
  // If Chilli Active: Pea (L), Chilli (C), Tomato (R)
  // If Pea Active: Tomato (L), Pea (C), Chilli (R)
  const getTransform = (id) => {
    const isActive = activePlantId === id;

    // Determine relative position
    let position = [0, 0, 0];
    let scale = 1;
    let zIndex = 0; // For sorting visual priority if needed, mostly z-pos handles this

    if (isActive) {
      position = [0, -1, 1.5]; // Center, close
      scale = 1.0;
    } else {
      // Logic to place left or right visually
      if (activePlantId === 'tomato') {
        if (id === 'chilli') position = [-2.0, -1, -1.5]; // Left Back
        if (id === 'pea') position = [2.0, -1, -1.5];    // Right Back
      } else if (activePlantId === 'chilli') {
        if (id === 'pea') position = [-2.0, -1, -1.5];   // Left Back
        if (id === 'tomato') position = [2.0, -1, -1.5]; // Right Back
      } else if (activePlantId === 'pea') {
        if (id === 'tomato') position = [-2.0, -1, -1.5]; // Left Back
        if (id === 'chilli') position = [2.0, -1, -1.5];  // Right Back
      }
      scale = 0.8;
    }

    return { position, scale };
  };

  // Data Card - Shows only active plant
  const currentDisplayId = activePlantId;

  return (
    <div className="home-container">
      {/* Navbar handled by App.jsx */}

      <div className="home-content">
        <div className="canvas-wrapper">
          <Canvas className="full-screen-canvas" camera={{ position: [0, 2, 8], fov: 50 }} shadows>
            {/* Darker background for the viewport to contrast with border */}
            <color attach="background" args={['#10151a']} />

            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 12, 8]} intensity={1.2} castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
            />
            <Environment preset="city" />

            <Suspense fallback={<Loader />}>

              {/* Plants */}
              <PlantGroup
                {...getTransform('chilli')}
                label="Chilli"
                onHover={() => setHoveredPlantId("chilli")}
                onLeave={() => setHoveredPlantId(null)}
                onClick={() => setActivePlantId("chilli")}
              >
                <ThreeChilli data={getPlantData("chilli")} />
              </PlantGroup>

              <PlantGroup
                {...getTransform('tomato')}
                label="Tomato"
                onHover={() => setHoveredPlantId("tomato")}
                onLeave={() => setHoveredPlantId(null)}
                onClick={() => setActivePlantId("tomato")}
              >
                <ThreeTomato data={getPlantData("tomato")} />
              </PlantGroup>

              <PlantGroup
                {...getTransform('pea')}
                label="Pea"
                onHover={() => setHoveredPlantId("pea")}
                onLeave={() => setHoveredPlantId(null)}
                onClick={() => setActivePlantId("pea")}
              >
                <ThreePea data={getPlantData("pea")} />
              </PlantGroup>

              {/* The New Greenhouse Environment */}
              <Greenhouse />

            </Suspense>

            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={1.2}
              maxPolarAngle={1.5}
            />
          </Canvas>

          {/* Overlay Card inside the border - Only shows for active plant */}
          <SensorCard data={getPlantData(currentDisplayId)} />
        </div>

        {/* Controls / Footer Area */}
        <div className="home-controls">
          <div className="instruction-text">
            Viewing Data for: <span style={{ color: '#4A9B7F', fontWeight: 'bold' }}>{getPlantData(activePlantId).name}</span>
          </div>

          <button
            className="btn-solid"
            onClick={() => navigate('/Sim')}
          >
            Open Full Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
