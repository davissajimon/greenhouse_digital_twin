import React, { useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF, Center } from '@react-three/drei';
import './scalability_test.css';

// --- MOCK DATA ---
const greenhouseGlobals = {
    temperature: 26.4,
    humidity: 64,
    airQuality: "Good",
    light: 820
};

const sensors = Array.from({ length: 8 }, (_, i) => ({
    id: `SENSOR_00${i + 1}`,
    soil_moisture: 30 + Math.random() * 50, // 30-80% random
    soil_temperature: 15 + Math.random() * 15, // 15-30°C random
    health: 80 + Math.random() * 20, // 80-100%
    growth: 0.8 + Math.random() * 0.4, // 0.8-1.2
    waterLevel: 60 + Math.random() * 30
}));

// --- LOGIC ADAPTED FROM ThreeTomato.jsx BUT WITH CLONING ---
const CONDITIONS = {
    OPTIMAL: 'OPTIMAL',
    HEAT_STRESS: 'HEAT_STRESS',
    FROST: 'FROST',
    DROUGHT: 'DROUGHT',
    ROOT_ROT: 'ROOT_ROT',
    WILTING_WET: 'WILTING_WET',
    SLOW_GROWTH: 'SLOW_GROWTH'
    // ... other conditions ignored for this demo or mapped loosely
};

function getCondition(globals, sensor) {
    // Simple logic to map sensor data to visual condition
    if (globals.temperature > 35) return CONDITIONS.HEAT_STRESS;
    if (globals.temperature < 5) return CONDITIONS.FROST;
    if (sensor.soil_moisture < 30) return CONDITIONS.DROUGHT;
    if (sensor.soil_moisture > 90) return CONDITIONS.ROOT_ROT;
    if (sensor.soil_temperature > 28) return CONDITIONS.HEAT_STRESS; // Hot soil
    if (sensor.health < 50) return CONDITIONS.SLOW_GROWTH;
    return CONDITIONS.OPTIMAL;
}

function PlantInstance({ position, sensorData, globals, onSelect, isSelected }) {
    // 1. Load the model (cached)
    const { scene } = useGLTF('/Untitled.glb');

    // 2. Clone the scene for this instance!
    // Standard clone(true) is recursive and works for most GLTFs
    const clone = useMemo(() => scene.clone(true), [scene]);

    // 3. Determine Condition
    const condition = getCondition(globals, sensorData);

    // 4. Apply visuals
    useEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                // Ensure unique material per instance
                if (!child.userData.isCloned) {
                    child.material = child.material.clone();
                    child.userData.isCloned = true;
                }

                const name = child.name ? child.name.toLowerCase() : '';
                const isLeaf = name.includes('leaf') || name.includes('leaves');
                const isFruit = name.includes('tomato');
                const isStem = name.includes('stem');
                const isPot = name.includes('pot');

                // Reset
                child.visible = true;
                if (isLeaf) {
                    child.material.color.set('#2E8B57');
                    child.material.emissive.setHex(0x000000);
                }
                if (isFruit) child.material.color.set('#c61b1b');

                // Highlight selection
                if (isSelected) {
                    child.material.emissive.setHex(0x222222); // subtle glow
                }

                // Apply Condition (Simplified copy from ThreeTomato)
                switch (condition) {
                    case CONDITIONS.FROST:
                        if (isLeaf) child.material.color.set('#aaccff');
                        if (isFruit) child.visible = false;
                        break;
                    case CONDITIONS.HEAT_STRESS:
                        if (isLeaf) child.material.color.set('#e6b800');
                        break;
                    case CONDITIONS.DROUGHT:
                        if (isLeaf) child.material.color.set('#8B7355');
                        break;
                    case CONDITIONS.ROOT_ROT:
                        if (isLeaf) child.material.color.set('#556B2F');
                        break;
                    default: break;
                }
            }
        });

    }, [clone, condition, isSelected]);

    return (
        <group position={position} onClick={(e) => { e.stopPropagation(); onSelect(sensorData); }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}>
            <primitive object={clone} scale={0.4} />
            {/* Label above plant */}
            <Html position={[0, 2.5, 0]} center distanceFactor={10}>
                <div style={{
                    background: isSelected ? '#4caf50' : 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap'
                }}>
                    {sensorData.id}
                </div>
            </Html>
        </group>
    );
}

export default function ScalabilityTest() {
    const [selectedSensor, setSelectedSensor] = useState(sensors[0]);

    return (
        <div className="scalability-container" style={{ height: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <header className="scalability-header">
                <h1>Scalability Demonstration</h1>
            </header>

            {/* Top Globals */}
            <div className="stats-panel">
                <div className="stat-card">
                    <span className="stat-label">Temperature</span>
                    <span className="stat-value">{greenhouseGlobals.temperature}°C</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Humidity</span>
                    <span className="stat-value">{greenhouseGlobals.humidity}%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Air Quality</span>
                    <span className="stat-value">{greenhouseGlobals.airQuality}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Light Intensity</span>
                    <span className="stat-value">{greenhouseGlobals.light} lm</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Units</span>
                    <span className="stat-value" style={{ color: '#4caf50' }}>{sensors.length}</span>
                </div>
            </div>

            <div className="scalability-content">
                <div className="scene-container">
                    <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }} style={{ width: '100%', height: '100%' }}>
                        <color attach="background" args={['#111']} />
                        <fog attach="fog" args={['#111', 5, 20]} />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

                        <Suspense fallback={null}>
                            <Center>
                                <group>
                                    {sensors.map((sensor, index) => {
                                        // Position them in a line
                                        const xPos = (index - (sensors.length - 1) / 2) * 3;
                                        return (
                                            <PlantInstance
                                                key={sensor.id}
                                                position={[xPos, 0, 0]}
                                                sensorData={sensor}
                                                globals={greenhouseGlobals}
                                                onSelect={setSelectedSensor}
                                                isSelected={selectedSensor?.id === sensor.id}
                                            />
                                        );
                                    })}

                                    {/* Floor */}
                                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                                        <planeGeometry args={[50, 10]} />
                                        <meshStandardMaterial color="#222" roughness={0.8} metalness={0.2} />
                                    </mesh>
                                </group>
                            </Center>
                        </Suspense>

                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI / 2}
                        />
                        <Environment preset="night" />
                    </Canvas>
                </div>

                {/* Side Panel */}
                <div className={`details-panel ${selectedSensor ? '' : 'hidden'}`}>
                    {selectedSensor && (
                        <>
                            <div className="panel-title">{selectedSensor.id} Details</div>

                            <div className="sensor-grid">
                                <div className="sensor-item">
                                    <label>Soil Moisture</label>
                                    <span style={{ color: selectedSensor.soil_moisture < 50 ? '#ffaa00' : '#aaddaa' }}>
                                        {selectedSensor.soil_moisture.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="sensor-item">
                                    <label>Soil Temp</label>
                                    <span style={{ color: selectedSensor.soil_temperature > 25 ? '#ffaa00' : '#aaddaa' }}>
                                        {selectedSensor.soil_temperature.toFixed(1)}°C
                                    </span>
                                </div>
                                <div className="sensor-item">
                                    <label>Health Index</label>
                                    <span style={{ color: selectedSensor.health < 90 ? '#ff6666' : '#aaddaa' }}>
                                        {selectedSensor.health.toFixed(1)}
                                    </span>
                                </div>
                                <div className="sensor-item">
                                    <label>Growth Rate</label>
                                    <span>{selectedSensor.growth.toFixed(2)}x</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#666' }}>
                                Status: <span style={{ color: '#fff' }}>Monitoring Active</span>
                                <br />
                                Last update: Just now
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
