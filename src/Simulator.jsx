import React, { useState, useMemo, Suspense } from "react";
import "./Simulator.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei";
import { ThreeTomato } from "./components/ThreeTomato";
import { useNavigate } from "react-router-dom";

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-gray-500 font-bold" style={{ color: '#666', fontWeight: 'bold' }}>{progress.toFixed(0)}% loaded</div></Html>;
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
  const [viewMode, setViewMode] = useState('2D'); // Safety Toggle State
  const simulateEndpoint = "http://127.0.0.1:5000/simulate";

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

  // --- ALERT ENGINE (unchanged) ---
  function evaluateAlerts(plantKey, env) {
    const alerts = [];

    if (plantKey === "tomato") {
      const t = Number(env.temperature);
      const h = Number(env.humidity);
      const s = Number(env.soil);
      const l = Number(env.light);
      const co2 = Number(env.co2);
      const p = Number(env.pressure);

      // Temperature
      if (!Number.isNaN(t) && t >= 40) {
        alerts.push({ id: "heatstroke", sensor: "temperature", level: "critical", title: "Heatstroke", description: "≥ 40°C — severe leaf & fruit damage likely." });
      } else if (!Number.isNaN(t) && t >= 30) {
        alerts.push({ id: "heatstress", sensor: "temperature", level: "warning", title: "Heat Stress", description: "30–39°C — poor pollination & slowed growth." });
      }
      if (!Number.isNaN(t) && t < 10 && t >= 0) {
        alerts.push({ id: "chilling", sensor: "temperature", level: "warning", title: "Chilling Injury", description: "< 10°C — growth slowdown possible." });
      }
      if (!Number.isNaN(t) && t < 0 && t >= -2) {
        alerts.push({ id: "frostbite", sensor: "temperature", level: "critical", title: "Frostbite", description: "0 to -2°C — tissue death likely." });
      }
      if (!Number.isNaN(t) && t < -2) {
        alerts.push({ id: "lethalfrost", sensor: "temperature", level: "fatal", title: "Lethal Frost", description: "< -2°C — lethal to plants." });
      }

      // Humidity
      if (!Number.isNaN(h) && h < 25) {
        alerts.push({ id: "hum_crit_low", sensor: "humidity", level: "critical", title: "Critical Low Humidity", description: "< 25% — Tissue dehydration & severe transpiration stress." });
      } else if (!Number.isNaN(h) && h < 40) {
        alerts.push({ id: "hum_low", sensor: "humidity", level: "warning", title: "Low-Humidity Stress", description: "< 40% — high transpiration & leaf drying." });
      }
      if (!Number.isNaN(h) && h > 95) {
        alerts.push({ id: "hum_crit_high", sensor: "humidity", level: "critical", title: "Critical High Humidity", description: "> 95% — condensation & severe disease risk." });
      } else if (!Number.isNaN(h) && h > 80) {
        alerts.push({ id: "hum_high", sensor: "humidity", level: "warning", title: "High-Humidity Stress", description: "> 80% — poor fruit set & disease risk." });
      }
      if (!Number.isNaN(h) && h >= 60 && h <= 70) {
        alerts.push({ id: "hum_optimal", sensor: "humidity", level: "ok", title: "Optimal Humidity", description: "60–70% — favorable for pollination and growth." });
      }

      // Soil moisture
      if (!Number.isNaN(s) && s < 15) {
        alerts.push({ id: "soil_drought_critical", sensor: "soil", level: "critical", title: "Severe Drought (Soil)", description: "< 15% — severe water stress, immediate irrigation required." });
      } else if (!Number.isNaN(s) && s >= 15 && s < 30) {
        alerts.push({ id: "soil_drought_warn", sensor: "soil", level: "warning", title: "Low Soil Moisture", description: "15–29% — drought stress developing." });
      }
      if (!Number.isNaN(s) && s > 85) {
        alerts.push({ id: "soil_waterlog_critical", sensor: "soil", level: "critical", title: "Waterlogging (Soil)", description: "> 85% — roots may suffocate; risk of root rot." });
      } else if (!Number.isNaN(s) && s > 70 && s <= 85) {
        alerts.push({ id: "soil_saturation_warn", sensor: "soil", level: "warning", title: "High Soil Moisture", description: "70–85% — near-saturation; monitor drainage." });
      }

      // Light
      if (!Number.isNaN(l) && l < 100) {
        alerts.push({ id: "light_low_warn", sensor: "light", level: "warning", title: "Low Light", description: "< 100 µmol/m²s — insufficient for good photosynthesis." });
      } else if (!Number.isNaN(l) && l >= 100 && l < 200) {
        alerts.push({ id: "light_subopt_warn", sensor: "light", level: "warning", title: "Suboptimal Light", description: "100–199 µmol/m²s — growth may be slower." });
      }
      if (!Number.isNaN(l) && l > 1600) {
        alerts.push({ id: "light_high_critical", sensor: "light", level: "critical", title: "Excessive Light", description: "> 1600 µmol/m²s — risk of photodamage/leaf scorch." });
      } else if (!Number.isNaN(l) && l > 1200 && l <= 1600) {
        alerts.push({ id: "light_high_warn", sensor: "light", level: "warning", title: "High Light", description: "1200–1600 µmol/m²s — watch for photoinhibition + heat." });
      }

      // CO2
      if (!Number.isNaN(co2) && co2 < 250) {
        alerts.push({ id: "co2_verylow_critical", sensor: "co2", level: "critical", title: "Very Low CO₂", description: "< 250 ppm — severely limits photosynthesis." });
      } else if (!Number.isNaN(co2) && co2 >= 250 && co2 < 300) {
        alerts.push({ id: "co2_low_warn", sensor: "co2", level: "warning", title: "Low CO₂", description: "250–299 ppm — suboptimal for growth." });
      }
      if (!Number.isNaN(co2) && co2 > 2000) {
        alerts.push({ id: "co2_veryhigh_critical", sensor: "co2", level: "critical", title: "Very High CO₂", description: "> 2000 ppm — potentially phytotoxic and hazardous to workers." });
      } else if (!Number.isNaN(co2) && co2 > 1200 && co2 <= 2000) {
        alerts.push({ id: "co2_high_warn", sensor: "co2", level: "warning", title: "High CO₂", description: "1200–2000 ppm — elevated CO₂; evaluate cause." });
      }

      // Pressure
      if (!Number.isNaN(p) && p < 970) {
        alerts.push({ id: "pressure_verylow_critical", sensor: "pressure", level: "critical", title: "Very Low Pressure", description: "< 970 hPa — may indicate extreme weather." });
      } else if (!Number.isNaN(p) && p >= 970 && p < 990) {
        alerts.push({ id: "pressure_low_warn", sensor: "pressure", level: "warning", title: "Low Pressure", description: "970–989 hPa — monitor for rapid environmental changes." });
      }
      if (!Number.isNaN(p) && p > 1045) {
        alerts.push({ id: "pressure_veryhigh_critical", sensor: "pressure", level: "critical", title: "Very High Pressure", description: "> 1045 hPa — unusual; check sensors & forecasts." });
      } else if (!Number.isNaN(p) && p > 1035 && p <= 1045) {
        alerts.push({ id: "pressure_high_warn", sensor: "pressure", level: "warning", title: "High Pressure", description: "1036–1045 hPa — monitor anomalies." });
      }
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
    } catch (err) {
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
    <div className="simulator-root">
      {/* LEFT: 70%  */}
      <div className="simulator-left-70">
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
                  <ThreeTomato healthStatus={healthStatus} temperature={values.temperature} />
                </Suspense>

                <Environment preset="studio" />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />

              </Canvas>

              <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', fontSize: '0.875rem', fontWeight: 600 }}>
                Simulated Twin
              </div>
            </div>
          </div>
          <div className="model-note">3d simulator from given values</div>
        </div>
      </div>

      {/* RIGHT: 30% details + simulator inputs + alerts */}
      <aside className="simulator-right-30">
        <div className="details-card">
          <div className="details-header">
            <div className="plant-select">
              <label style={{ fontWeight: 700 }}>Plant:</label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="plant-dropdown"
              >
                <option value="tomato">Tomato</option>
              </select>

            </div>
            {/* Back button moved below alerts; keep header clean */}
            <div style={{ width: 48 }} />
          </div>

          {/* Environment simulator (no sliders) */}
          <div className="env-sim">
            <div className="env-grid">
              <div className="env-row">
                <label>Temperature (°C)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="0.1"
                  value={values.temperature}
                  onChange={(e) => update("temperature", e.target.value)}
                />
              </div>

              <div className="env-row">
                <label>Humidity (%)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="1"
                  value={values.humidity}
                  onChange={(e) => update("humidity", e.target.value)}
                />
              </div>

              <div className="env-row">
                <label>Soil Moisture (%)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="1"
                  value={values.soil}
                  onChange={(e) => update("soil", e.target.value)}
                />
              </div>

              <div className="env-row">
                <label>Light (µmol/m²s)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="1"
                  value={values.light}
                  onChange={(e) => update("light", e.target.value)}
                />
              </div>

              <div className="env-row">
                <label>CO₂ (ppm)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="1"
                  value={values.co2}
                  onChange={(e) => update("co2", e.target.value)}
                />
              </div>

              <div className="env-row">
                <label>Pressure (hPa)</label>
                <input
                  style={{ backgroundColor: "#E7F2EF", color: "black" }}
                  type="number"
                  step="1"
                  value={values.pressure}
                  onChange={(e) => update("pressure", e.target.value)}
                />
              </div>
            </div>

            {/* placeholder to keep layout balanced */}
            <div style={{ width: 110 }} />
          </div>

          {message && (
            <div
              className={`message ${message.type === "ok" ? "ok" : message.type === "warn" ? "warn" : "err"
                }`}
            >
              {message.text}
            </div>
          )}

          {/* Alerts grid below inputs */}
          <div className="alerts-section">
            <h4>Sensor Alerts</h4>
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

            {/* Simulate + Reset placed below alerts, same line */}
            <div
              className="alerts-actions"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 344,
                marginTop: 15,
              }}
            >
              <button
                onClick={handleSimulate}
                disabled={loading}
                style={{
                  background: "#E7F2EF",
                  color: "#19183B",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontWeight: 700,
                  boxShadow: "0 8px 22px rgba(231,242,239,0.55)",
                  border: "1px solid rgba(25,24,59,0.06)",
                  cursor: "pointer",
                }}
              >
                {loading ? "Simulating..." : "Simulate"}
              </button>

              <button
                className="btn-ghost"
                onClick={() => {
                  setValues(defaults);
                  setMessage(null);
                }}
                style={{
                  background: "#E7F2EF",
                  color: "#19183B",
                  padding: "8px 27px",
                  borderRadius: 6,
                  fontWeight: 700,
                  boxShadow: "0 8px 22px rgba(231,242,239,0.55)",
                  border: "1px solid rgba(25,24,59,0.06)",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
            <br></br>
            {/* Back to Home on its own row below the two buttons */}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#19183B",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                aria-label="Back to Home"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
