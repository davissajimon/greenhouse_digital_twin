import React, { useEffect, useState, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

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

  const backendUrl = "http://127.0.0.1:5000/sensors"; // change if different

  async function fetchSensors() {
    try {
      const res = await fetch(backendUrl);
      if (!res.ok) throw new Error("Network response not OK: " + res.status);
      const data = await res.json();
      if (data && Array.isArray(data.sensors)) {
        setSensors(
          data.sensors.map((s) => ({
            id: s.id,
            name: s.name,
            value: s.value,
            raw_value: s.raw_value,
            unit: s.unit,
            working: s.working,
          }))
        );
        setLastUpdate(data.timestamp || new Date().toISOString());
      }
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
      <div className="layout">
        <main className="main">
          <div className="model-box">
            <div className="model-placeholder">
              <img
                src="/src/assets/healthy_tomato.png"
                alt="3D model placeholder"
                style={{ width: "1300px", height: "auto" }}
              />
            </div>
            <div className="note">3D Twin Viewer (placeholder)</div>
          </div>

          <div className="sensor-grid">
            {sensors.map((s) => (
              <div key={s.id} className="sensor-card">
                <div>
                  <div className="sensor-name">{s.name}</div>
                  <div className="sensor-value">{s.value}</div>
                </div>
                <div className="sensor-id">ID: {s.id}</div>
              </div>
            ))}
          </div>
        </main>

        <aside className="right-panel">
          <div className="status-box">
            <h2>Sensor Status</h2>
            <p className="small-label">
              Showing connected sensors — all ON (placeholder)
            </p>

            <ul className="status-list">
              {sensors.map((s) => (
                <li key={s.id} className="status-item">
                  <div>
                    <div className="status-name">{s.name}</div>
                    <div className="status-value">{s.value}</div>
                  </div>

                  <div className="toggle-box">
                    <span>Working</span>
                    <div className={`toggle ${s.working ? "on" : ""}`}></div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="footer-info">
              <div>
                Last update: <span>{lastUpdate || "—"}</span>
              </div>
              <div>
                Data source: <span>Flask Simulated API</span>
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn-outline" onClick={fetchSensors}>
              Refresh Data
            </button>

            {/* navigate to /simulator (ensure this is the same path you registered in App.jsx) */}
            <button className="btn-solid" onClick={() => navigate("/Sim")}>
              Open Simulator
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
