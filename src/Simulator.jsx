import React, { useState, useMemo, Suspense } from "react";
import "./Simulator.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { ThreeChilli } from "./components/ThreeChilli";
import { ThreePea } from "./components/ThreePea";
import { getTomatoAlerts } from "./components/ThreeTomatoThresholds";
import { getChilliAlerts } from "./components/ThreeChilliThresholds";
import { getPeaAlerts } from "./components/ThreePeaThresholds";
import { useNavigate } from "react-router-dom";

function Loader() {
  return <Html center><img src="/loading.gif" alt="Loading..." style={{ width: '100px', height: '100px', backgroundColor: 'transparent', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' }} /></Html>;
}

export default function Simulator() {

  const navigate = useNavigate();

  const defaults = {
    temperature: 25.0,
    humidity: 55,
    soil: 35,
    light: 500,
    co2: 420,
    pressure: 1013,
  };

  const [values, setValues] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [plant, setPlant] = useState("tomato");
 // const [viewMode, setViewMode] = useState('2D'); // Safety Toggle State
  const simulateEndpoint = "https://greenhouse-digital-twin.onrender.com/simulate";

  function update(key, v) {
    const parsed =
      v === ""
        ? ""
        : key === "temperature" ||
          key === "light" ||
          key === "co2" ||
          key === "pressure"
          ? Number(v)
          : Number(v);
    setValues((prev) => ({ ...prev, [key]: parsed }));
  }

  // --- UNIVERSAL ALERT ENGINE ---
  // Gets thresholds from respective plant component files
  function evaluateAlerts(plantKey, env) {
    let alerts = [];

    switch (plantKey) {
      case "tomato":
        alerts = getTomatoAlerts(env);
        break;
      case "chilli":
        alerts = getChilliAlerts(env);
        break;
      case "pea":
        alerts = getPeaAlerts(env);
        break;
      default:
        alerts = getTomatoAlerts(env); // Default to tomato
    }

    if (alerts.length === 0) {
      alerts.push({
        id: "ok_all",
        sensor: "all",
        level: "ok",
        title: "Conditions Normal",
        description: "No thresholds breached for selected plant.",
      });
    }

    return alerts;
  }

  const liveAlerts = useMemo(
    () => evaluateAlerts(plant, values),
    [plant, values]
  );

  const groupedAlerts = useMemo(() => {
    const order = { fatal: 4, critical: 3, warning: 2, ok: 1 };
    const groups = {};
    for (const a of liveAlerts) {
      const key = a.sensor || "other";
      groups[key] = groups[key] || [];
      groups[key].push(a);
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((x, y) => (order[y.level] || 0) - (order[x.level] || 0));
    }
    return groups;
  }, [liveAlerts]);

  // -------------------------
  // NEW: 3D Model Logic
  // -------------------------
  const healthStatus = useMemo(() => {
    const hasFatalOrCritical = liveAlerts.some(a => a.level === 'fatal' || a.level === 'critical');
    if (hasFatalOrCritical) return 'critical';

    const hasWarning = liveAlerts.some(a => a.level === 'warning');
    if (hasWarning) return 'warning';

    return 'healthy';
  }, [liveAlerts]);

  async function handleSimulate() {
    setMessage(null);
    setLoading(true);
    const payload = {
      timestamp: new Date().toISOString(),
      source: "simulator-ui",
      plant: plant,
      environment: {
        temperature: Number(values.temperature),
        humidity: Number(values.humidity),
        soil_moisture: Number(values.soil),
        light: Number(values.light),
        co2: Number(values.co2),
        pressure: Number(values.pressure),
      },
      alerts: liveAlerts,
    };

    try {
      const res = await fetch(simulateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setMessage({
          type: "warn",
          text:
            `Backend returned ${res.status}. UI simulated success.` +
            (text ? ` (${text})` : ""),
        });
      } else {
        const data = await res.json().catch(() => null);
        setMessage({
          type: "ok",
          text:
            `Simulation accepted by backend.` +
            (data ? ` Response: ${JSON.stringify(data)}` : ""),
        });
      }
    } catch {
      setMessage({
        type: "ok",
        text: "Backend unreachable — simulation applied locally (UI simulated).",
      });
    } finally {
      setLoading(false);
    }
  }

  const sensorLabel = (k) =>
  ({
    temperature: "Temperature",
    humidity: "Humidity",
    soil: "Soil Moisture",
    light: "Light (PAR)",
    co2: "CO₂",
    pressure: "Pressure",
    all: "All Sensors",
    other: "Other",
  }[k] || k);

  return (
    <div className="sim-container">
      <div className="sim-card">
        <div className="sim-card-inner">
          <div className="header">
            <h1>Simulator</h1>
            <p>Adjust parameters and observe 3D model changes</p>
          </div>

          <div className="responsive-layout">
            {/* Main Content - 3D Scene */}
            <main className="main-content">
              <div className="model-section">
                <div className="model-box">
                  <div className="model-placeholder">
                    {/* 3D Digital Twin Viewer */}
                    <div className="model-viewport">
                      <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>

                {/* Dynamic Lighting based on Temperature */}
                {(() => {
                  const t = Number(values.temperature);
                  let bg = '#e8eaed'; // Default Neutral
                  let lightInt = 1.2;
                  let lightColor = '#ffffff';

                  // Heat Stroke (> 40) - Intense Orange/Red Visuals
                  if (t > 40) {
                    bg = '#ffccbc';       // Warm Orange Background
                    lightInt = 2.0;       // Bright Sunshine
                    lightColor = '#fff3e0'; // Warm Light
                  }
                  // Heat Stress (30 - 40) - Warm Yellow
                  else if (t > 30) {
                    bg = '#fff9c4';       // Light Yellow
                    lightInt = 1.5;
                  }
                  // Frostbite (<= 0) - Cold Blue/Grey
                  else if (t <= 0) {
                    bg = '#b0bec5';       // Cold Grey
                    lightInt = 0.5;       // Dim
                    lightColor = '#e3f2fd'; // Icy Blue Light
                  }
                  // Chilling (< 10) - Cool Tint
                  else if (t < 10) {
                    bg = '#cfd8dc';       // Cool Grey
                    lightInt = 0.8;
                  }

                  return (
                    <>
                      <color attach="background" args={[bg]} />
                      <ambientLight intensity={lightInt * 0.6} color={lightColor} />
                      <directionalLight position={[5, 10, 7.5]} intensity={lightInt} color={lightColor} castShadow />
                    </>
                  );
                })()}

                {/* Suspense is CRITICAL for loading async models */}
                <Suspense fallback={<Loader />}>
                  {plant === "tomato" && <ThreeTomato healthStatus={healthStatus} temperature={values.temperature} />}
                  {plant === "chilli" && <ThreeChilli temperature={values.temperature} />}
                  {plant === "pea" && <ThreePea temperature={values.temperature} />}
                  
                  {/* Ground Plane */}
                  {/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5, 0]} receiveShadow>
                    <planeGeometry args={[20, 20]} />
                    <meshStandardMaterial color="#d4c5b9" roughness={0.8} metalness={0.1} />
                  </mesh> */}
                </Suspense>

                <Environment preset="studio" />
                        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />

                      </Canvas>

                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', fontSize: '0.875rem', fontWeight: 600 }}>
                        Simulated Twin
                      </div>
                    </div>
                  </div>
                  <div className="model-label">3D Simulator</div>
                </div>
              </div>

            </main>

            {/* Sidebar - Controls & Alerts */}
            <aside className="sidebar-panel">
        <div className="controls-section">
          <div className="plant-select">
            <label>Plant:</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="plant-dropdown"
            >
              <option value="tomato">Tomato</option>
              <option value="chilli">Chilli</option>
              <option value="pea">Pea</option>
            </select>
          </div>

          {/* Environment Controls */}
          <div className="controls-grid">
            <div className="control-row">
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={values.temperature}
                onChange={(e) => update("temperature", e.target.value)}
              />
            </div>

            <div className="control-row">
              <label>Humidity (%)</label>
              <input
                type="number"
                step="1"
                value={values.humidity}
                onChange={(e) => update("humidity", e.target.value)}
              />
            </div>

            <div className="control-row">
              <label>Soil Moisture (%)</label>
              <input
                type="number"
                step="1"
                value={values.soil}
                onChange={(e) => update("soil", e.target.value)}
              />
            </div>

            <div className="control-row">
              <label>Light (µmol/m²s)</label>
              <input
                type="number"
                step="1"
                value={values.light}
                onChange={(e) => update("light", e.target.value)}
              />
            </div>

            <div className="control-row">
              <label>CO₂ (ppm)</label>
              <input
                type="number"
                step="1"
                value={values.co2}
                onChange={(e) => update("co2", e.target.value)}
              />
            </div>

            <div className="control-row">
              <label>Pressure (hPa)</label>
              <input
                type="number"
                step="1"
                value={values.pressure}
                onChange={(e) => update("pressure", e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Alerts Section */}
        <div className="alerts-section">
          <h3 className="alerts-title">Sensor Alerts</h3>
          <div className="sensor-alerts-grid">
            {["temperature", "humidity", "soil", "light", "co2", "pressure"].map(
              (sensorKey) => {
                const list = groupedAlerts[sensorKey] || [];
                const primary = list.length
                  ? list[0]
                  : { level: "ok", title: "OK", description: "No issues" };
                return (
                  <div
                    key={sensorKey}
                    className={`sensor-alert-tile ${primary.level}`}
                  >
                    <div className="tile-header">
                      <div className="tile-sensor">{sensorLabel(sensorKey)}</div>
                      <div className={`severity-chip ${primary.level}`}>
                        {primary.level.toUpperCase()}
                      </div>
                    </div>
                    <div className="tile-main">
                      <div className="tile-title">{primary.title}</div>
                      <div className="tile-desc">{primary.description}</div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="btn-solid"
          >
            {loading ? "Simulating..." : "Simulate"}
          </button>

          <button
            onClick={() => {
              setValues(defaults);
              setMessage(null);
            }}
            className="btn-outline"
          >
            Reset Values
          </button>

          <button
            onClick={() => navigate("/")}
            className="btn-outline"
          >
            ← Back to Home
          </button>
        </div>
      </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
