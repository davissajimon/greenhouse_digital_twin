import React, { Suspense, useCallback, useRef, useState, lazy } from "react";
import { fetchWeather, getWeatherIconUrl } from "../modules/weather/weatherService";
import { getWeatherImpactSummary } from "../modules/simulator/geoSimulatorBridge";
import "./GeoSection.css";

const GlobeView = lazy(() => import("../modules/globe/GlobeView"));

export default function GeoSection({ geoWeather, onWeatherUpdate, onReady }) {
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const handleLocationSelect = useCallback(async ({ lat, lon }) => {
        setSelectedCoords({ lat, lon });
        setLoading(true);
        setError(null);
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
            const wd = await fetchWeather(lat, lon, ctrl.signal);
            setLoading(false);
            if (onWeatherUpdate) onWeatherUpdate(wd);
        } catch (err) {
            if (err.name === "AbortError") return;
            setError(err.message);
            setLoading(false);
        }
    }, [onWeatherUpdate]);

    const scrollToSimulator = () => {
        const el = document.getElementById("section-simulator");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="geo-section">
            {/* ═══ Background Atmosphere ═══ */}
            <div className="geo-bg-gradient" />

            {/* ═══ Left Content ═══ */}
            <div className="geo-content">
                <div className="geo-header">
                    <div className="geo-badge">GEOSIMULATION</div>
                    <h1 className="geo-title">
                        Where Do<br />You Live?
                    </h1>
                    <p className="geo-subtitle">
                        Select your location on the globe to fetch real-time weather data.
                        <br />
                        We'll simulate how your plant handles those conditions.
                    </p>
                </div>

                {/* ═══ Weather Result Card ═══ */}
                {loading && (
                    <div className="geo-weather-card loading-card">
                        <div className="geo-loading-spinner" />
                        <span>Fetching weather data…</span>
                    </div>
                )}

                {error && (
                    <div className="geo-weather-card error-card">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                {geoWeather && !loading && (
                    <div className="geo-weather-card">
                        <div className="geo-weather-top">
                            <img
                                className="geo-weather-icon"
                                src={getWeatherIconUrl(geoWeather.conditionIcon)}
                                alt={geoWeather.conditionDetail}
                            />
                            <div className="geo-weather-info">
                                <span className="geo-city">
                                    {geoWeather.cityName}
                                    {geoWeather.country && <small> {geoWeather.country}</small>}
                                </span>
                                <span className="geo-temp">{geoWeather.temperature}°C</span>
                            </div>
                        </div>
                        <div className="geo-weather-details">
                            <span>💧 {geoWeather.humidity}%</span>
                            <span>☁️ {geoWeather.condition}</span>
                            <span>💨 {geoWeather.windSpeed} m/s</span>
                        </div>
                        <div className="geo-impact">
                            {getWeatherImpactSummary(geoWeather)}
                        </div>
                    </div>
                )}

                {selectedCoords && (
                    <div className="geo-coords">
                        📍 {selectedCoords.lat.toFixed(4)}°, {selectedCoords.lon.toFixed(4)}°
                    </div>
                )}

                {/* ═══ CTA Button ═══ */}
                {geoWeather && !loading && (
                    <button className="geo-cta" onClick={scrollToSimulator}>
                        <span>Test Plant Survival</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                )}

                {!selectedCoords && !loading && (
                    <div className="geo-hint">
                        <span>Click anywhere on the globe to begin</span>
                    </div>
                )}
            </div>

            {/* ═══ Globe ═══ */}
            <div className="geo-globe-area">
                <Suspense
                    fallback={
                        <div className="geo-globe-loading">
                            <div className="geo-loading-spinner" />
                            <span>Loading Globe…</span>
                        </div>
                    }
                >
                    <GlobeView
                        onLocationSelect={handleLocationSelect}
                        selectedCoords={selectedCoords}
                        onReady={onReady}
                    />
                </Suspense>
            </div>
        </div>
    );
}
