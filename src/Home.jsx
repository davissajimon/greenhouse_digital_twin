import React, { useState, useEffect, Suspense, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Html } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";

import { evaluatePlantHealth } from "./utils/PlantHealthEngine";

function SensorCard({ data, apiData }) {
  // Use API data if available, otherwise fall back to local data
  console.log("SensorCard - apiData:", apiData);
  console.log("SensorCard - apiData.plant:", apiData?.plant);
  console.log("SensorCard - data:", data);
  
  let displayData = null;
  
  if (apiData && apiData.plant) {
    console.log("Using API data");
    displayData = {
      name: apiData.plant.species || "Unknown",
      temperature: Number(apiData.universal?.room_temperature) || 0,
      soil_moisture: Number(apiData.plant.soil_moisture) || 0,
      sensor_number: apiData.plant.sensor_number || 0,
      timestamp: apiData.plant.timestamp || "",
      humidity: Number(apiData.universal?.room_humidity) || 0,
      soil_temperature: Number(apiData.plant.temperature) || 0,
      light: 0,
      air_quality: Number(apiData.universal?.air_quality) || 0
    };
  } else if (data) {
    console.log("Using local data");
    displayData = data;
  }

  console.log("displayData:", displayData);

  if (!displayData || !displayData.name) {
    console.log("No display data available");
    return null;
  }

  let health = { color: "#2E8B57", label: "Healthy" };
  try {
    health = evaluatePlantHealth(displayData);
  } catch (err) {
    console.error("Error evaluating plant health:", err);
  }

  return (
    <div className="sensor-card-home-overlay" style={{ borderColor: health.color, boxShadow: `0 8px 32px ${health.color}33` }}>
      <div className="card-header">
        <h2>{displayData.name || "Unknown Plant"}</h2>
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
          <span className="value">{displayData.temperature}°C</span>
        </div>
        <div className="card-item">
          <span className="label">Humidity</span>
          <span className="value">{displayData.humidity}%</span>
        </div>
        <div className="card-item">
          <span className="label">Soil Moisture</span>
          <span className="value">{displayData.soil_moisture}%</span>
        </div>
        <div className="card-item">
          <span className="label">Soil Temp</span>
          <span className="value">{displayData.soil_temperature}°C</span>
        </div>
        <div className="card-item">
          <span className="label">Light</span>
          <span className="value">{displayData.light} PAR</span>
        </div>
        <div className="card-item">
          <span className="label">Air Qual</span>
          <span className="value">{displayData.air_quality} AQI</span>
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
  const [speciesName, setSpeciesName] = useState("");
  const [sensorNumber, setSensorNumber] = useState("");
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [activeSpecies, setActiveSpecies] = useState(null);
  const [activeSensor, setActiveSensor] = useState(null);
  const navigate = useNavigate();

  // Debug: Log when fetchedData changes
  useEffect(() => {
    console.log("fetchedData state updated:", fetchedData);
  }, [fetchedData]);
  const handleStartFetching = () => {
    if (!speciesName.trim() || !sensorNumber) {
      setError("Please enter both species name and sensor number");
      return;
    }

    // Start the auto-fetch loop
    setActiveSpecies(speciesName);
    setActiveSensor(sensorNumber);
    setIsAutoFetching(true);
    setError(null);
    console.log("Starting auto-fetch for:", speciesName, sensorNumber);
  };

  const handleStopFetching = () => {
    setIsAutoFetching(false);
    console.log("Stopped auto-fetch");
  };
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch(`https://gdt-2.onrender.com/api/sensors/all`);
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
    const interval = setInterval(fetchSensors, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-fetch sensor data every 10 seconds when isAutoFetching is true
  useEffect(() => {
    if (!isAutoFetching || !activeSpecies || !activeSensor) {
      return;
    }

    const autoFetch = async () => {
      try {
        const url = `https://gdt-2.onrender.com/get_data/${activeSpecies}/${activeSensor}`;
        console.log("Auto-fetching from:", url, "at", new Date().toLocaleTimeString());
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Auto-fetched data:", data);
        setFetchedData(data);
        setError(null);
      } catch (err) {
        console.error("Auto-fetch error:", err);
        setError(err.message);
      }
    };

    // Fetch immediately
    autoFetch();

    // Set up interval for every 10 seconds
    const interval = setInterval(autoFetch, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isAutoFetching, activeSpecies, activeSensor]);

  const getPlantData = (id) => {
    // If API data is fetched and active plant matches, use it; otherwise use local data
    if (fetchedData && fetchedData.plant) {
      // Map API data to match the expected format for plant components
      return {
        plant_id: id,
        name: fetchedData.plant.species || "Unknown",
        temperature: Number(fetchedData.universal?.room_temperature) || 0,
        humidity: Number(fetchedData.universal?.room_humidity) || 0,
        soil_moisture: Number(fetchedData.plant.soil_moisture) || 0,
        soil_temperature: Number(fetchedData.plant.temperature) || 0,
        light: 0,
        air_quality: Number(fetchedData.universal?.air_quality) || 0
      };
    }
    return plantsData.find(p => p.plant_id === id) || {};
  };

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
          <SensorCard data={getPlantData(currentDisplayId)} apiData={fetchedData} />
        </div>

        {/* Controls / Footer Area */}
        <div className="home-controls">
          <div className="instruction-text">
            Viewing Data for: <span style={{ color: '#4A9B7F', fontWeight: 'bold' }}>{getPlantData(activePlantId).name}</span>
          </div>

          {/* API Data Fetch Section */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a2a2a', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Fetch Sensor Data</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Species name (e.g., Tomato)"
                value={speciesName}
                onChange={(e) => setSpeciesName(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '8px 12px',
                  backgroundColor: '#0f1f1f',
                  color: '#fff',
                  border: '1px solid #4A9B7F',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              
              <input
                type="number"
                placeholder="Sensor number"
                value={sensorNumber}
                onChange={(e) => setSensorNumber(e.target.value)}
                style={{
                  flex: 0.5,
                  minWidth: '100px',
                  padding: '8px 12px',
                  backgroundColor: '#0f1f1f',
                  color: '#fff',
                  border: '1px solid #4A9B7F',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />

              <button
                onClick={isAutoFetching ? handleStopFetching : handleStartFetching}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isAutoFetching ? '#d9534f' : '#4A9B7F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {isAutoFetching ? 'Stop Fetching' : 'Start Fetching'}
              </button>
            </div>

            {error && (
              <div style={{ color: '#ff6b6b', marginBottom: '10px', fontSize: '14px' }}>
                Error: {error}
              </div>
            )}
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