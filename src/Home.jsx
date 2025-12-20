import React, { useEffect, useState, useRef, Suspense } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";

function Loader() {
  return <Html center><img src="/loading.gif" alt="Loading..." style={{ width: '100px', height: '100px', backgroundColor: 'transparent', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))' }} /></Html>;
}

export default function Home() {
  const navigate = useNavigate(); // <-- added

  const [sensors, setSensors] = useState([
    { id: "t1", name: "Temperature", value: "— °C" },
    { id: "h1", name: "Humidity", value: "— %" },
    { id: "s1", name: "Soil Moisture", value: "— %" },
    { id: "l1", name: "Light (PAR)", value: "— µmol/m²s" },
    { id: "co1", name: "CO₂", value: "— ppm" },
    { id: "p1", name: "Pressure", value: "— hPa" },
  ]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollingRef = useRef(null);

  const backendUrl = "https://greenhouse-digital-twin.onrender.com/api/sensors"; // change if different

async function fetchSensors() {
  try {
    const res = await fetch(backendUrl);
    if (!res.ok) throw new Error("Network response not OK: " + res.status);
    const json = await res.json();

    if (!json || !json.data) return;

    const { temperature, soil_moisture, timestamp } = json.data;

    setSensors([
      {
        id: "t1",
        name: "Temperature",
        value: temperature !== null ? `${temperature} °C` : "— °C",
        raw_value: temperature,
        unit: "°C",
        working: temperature !== null,
      },
      {
        id: "s1",
        name: "Soil Moisture",
        value: soil_moisture !== null ? `${soil_moisture}` : "—",
        raw_value: soil_moisture,
        unit: "ADC",
        working: soil_moisture !== null,
      },
      {
        id: "h1",
        name: "Humidity",
        value: "— %",
        raw_value: null,
        unit: "%",
        working: false,
      },
      {
        id: "l1",
        name: "Light (PAR)",
        value: "— µmol/m²s",
        raw_value: null,
        unit: "µmol/m²s",
        working: false,
      },
      {
        id: "co1",
        name: "CO₂",
        value: "— ppm",
        raw_value: null,
        unit: "ppm",
        working: false,
      },
      {
        id: "p1",
        name: "Pressure",
        value: "— hPa",
        raw_value: null,
        unit: "hPa",
        working: false,
      },
    ]);

    setLastUpdate(timestamp || new Date().toISOString());
  } catch (err) {
    console.error("Failed to fetch sensors:", err);
  }
}


  useEffect(() => {
    fetchSensors();
    pollingRef.current = setInterval(fetchSensors, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <div className="home-container">
      <div className="center-card">
        <div className="center-card-inner">
          <div className="header">
            <h1>Greenhouse Digital Twin</h1>
            <p>Real-time sensor monitoring & 3D visualization</p>
          </div>

          <div className="responsive-layout">
            {/* Main Content - Top on mobile, left on desktop */}
            <main className="main-content">
              {/* 3D Model Section */}
              <div className="model-section">
                <div className="model-box">
                  <div className="model-placeholder">
                    <Canvas
                      style={{ width: "100%", height: "100%" }}
                      camera={{ position: [0, 0, 15], fov: 50 }}
                    >
                      <Suspense fallback={<Loader />}>
                        <ThreeTomato temperature={sensors.find(s => s.id === "t1")?.raw_value || 25} humidity={sensors.find(s => s.id === "h1")?.raw_value || 65} />
                        <Environment preset="studio" />
                        <OrbitControls />
                      </Suspense>
                    </Canvas>
                  </div>
                  <div className="model-label">3D Twin Viewer</div>
                </div>
              </div>

              {/* Sensor Grid - Responsive */}
              <div className="sensor-section">
                <h2 className="section-title">Live Sensor Data</h2>
                <div className="sensor-grid">
                  {sensors.map((s) => (
                    <div key={s.id} className="sensor-card">
                      <div className="sensor-content">
                        <div className="sensor-name">{s.name}</div>
                        <div className="sensor-value">{s.value}</div>
                      </div>
                      <div className="sensor-id">ID: {s.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {/* Sidebar - Right on desktop, bottom on mobile/tablet */}
            <aside className="sidebar-panel">
              <div className="status-section">
                <div className="status-box">
                  <h2>Sensor Status</h2>
                  <p className="small-label">
                    Showing connected sensors — all ON
                  </p>

                  <ul className="status-list">
                    {sensors.map((s) => (
                      <li key={s.id} className="status-item">
                        <div className="status-item-content">
                          <div className="status-name">{s.name}</div>
                          <div className="status-value">{s.value}</div>
                        </div>

                        <div className="toggle-box">
                          <div className={`toggle ${s.working ? "on" : ""}`}></div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="footer-info">
                    <div className="info-row">
                      <span>Last update:</span>
                      <span>{lastUpdate || "—"}</span>
                    </div>
                    <div className="info-row">
                      <span>Data source:</span>
                      <span>Flask Simulated API</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="actions-section">
                <button className="btn-outline" onClick={fetchSensors}>
                  ↻ Refresh Data
                </button>

                <button className="btn-solid" onClick={() => navigate("/Sim")}>
                  Open Simulator
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
