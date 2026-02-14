/**
 * GeoSimPanel.jsx
 * 
 * The Geo Simulation Panel component.
 * Contains the globe, weather data display, and "Apply to Simulator" controls.
 * This is designed to be embedded within the Simulator page.
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { GlobeView } from '../globe/GlobeView';
import { fetchWeather, getWeatherIconUrl } from '../weather/weatherService';
import { weatherToSimulatorState, getWeatherImpactSummary } from '../simulator/geoSimulatorBridge';

function GeoSimPanelComponent({ onApplyWeather, isActive }) {
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoApply, setAutoApply] = useState(true);
    const abortRef = useRef(null);

    const handleLocationSelect = useCallback(async ({ lat, lon }) => {
        setSelectedCoords({ lat, lon });
        setLoading(true);
        setError(null);

        // Cancel previous fetch if still in-flight
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const weatherData = await fetchWeather(lat, lon, controller.signal);
            setWeather(weatherData);
            setLoading(false);

            // Auto-apply to simulator if enabled
            if (autoApply && onApplyWeather) {
                const simState = weatherToSimulatorState(weatherData);
                onApplyWeather(simState, weatherData);
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError(err.message);
            setLoading(false);
        }
    }, [autoApply, onApplyWeather]);

    const handleManualApply = useCallback(() => {
        if (!weather || !onApplyWeather) return;
        const simState = weatherToSimulatorState(weather);
        onApplyWeather(simState, weather);
    }, [weather, onApplyWeather]);

    if (!isActive) return null;

    return (
        <div className="geo-sim-panel">
            {/* Globe Section */}
            <div className="geo-globe-section">
                <div className="geo-section-header">
                    <span className="geo-icon">🌍</span>
                    <h3>Geo Simulation</h3>
                    <span className="geo-subtitle">Click anywhere on the globe</span>
                </div>
                <GlobeView
                    onLocationSelect={handleLocationSelect}
                    selectedCoords={selectedCoords}
                />
            </div>

            {/* Weather Data Section */}
            <div className="geo-data-section">
                {/* Coordinates Display */}
                {selectedCoords && (
                    <div className="geo-coords">
                        <div className="geo-coord-item">
                            <span className="geo-coord-label">LAT</span>
                            <span className="geo-coord-value">{selectedCoords.lat.toFixed(4)}°</span>
                        </div>
                        <div className="geo-coord-item">
                            <span className="geo-coord-label">LON</span>
                            <span className="geo-coord-value">{selectedCoords.lon.toFixed(4)}°</span>
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="geo-loading">
                        <div className="geo-loading-pulse" />
                        <span>Fetching weather data...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="geo-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                {/* Weather Data Display */}
                {weather && !loading && (
                    <div className="geo-weather-card">
                        <div className="geo-weather-header">
                            <div className="geo-weather-location">
                                <span className="geo-city">{weather.cityName}</span>
                                {weather.country && <span className="geo-country">{weather.country}</span>}
                            </div>
                            <img
                                className="geo-weather-icon"
                                src={getWeatherIconUrl(weather.conditionIcon)}
                                alt={weather.conditionDetail}
                            />
                        </div>

                        <div className="geo-weather-grid">
                            <div className="geo-metric">
                                <span className="geo-metric-icon">🌡️</span>
                                <span className="geo-metric-value">{weather.temperature}°C</span>
                                <span className="geo-metric-label">Temperature</span>
                            </div>
                            <div className="geo-metric">
                                <span className="geo-metric-icon">💧</span>
                                <span className="geo-metric-value">{weather.humidity}%</span>
                                <span className="geo-metric-label">Humidity</span>
                            </div>
                            <div className="geo-metric">
                                <span className="geo-metric-icon">🌤️</span>
                                <span className="geo-metric-value">{weather.condition}</span>
                                <span className="geo-metric-label">Condition</span>
                            </div>
                            <div className="geo-metric">
                                <span className="geo-metric-icon">💨</span>
                                <span className="geo-metric-value">{weather.windSpeed} m/s</span>
                                <span className="geo-metric-label">Wind</span>
                            </div>
                            <div className="geo-metric">
                                <span className="geo-metric-icon">☁️</span>
                                <span className="geo-metric-value">{weather.cloudCover}%</span>
                                <span className="geo-metric-label">Clouds</span>
                            </div>
                            <div className="geo-metric">
                                <span className="geo-metric-icon">🤒</span>
                                <span className="geo-metric-value">{weather.feelsLike}°C</span>
                                <span className="geo-metric-label">Feels Like</span>
                            </div>
                        </div>

                        {/* Impact Summary */}
                        <div className="geo-impact">
                            <span>{getWeatherImpactSummary(weather)}</span>
                        </div>

                        {/* Controls */}
                        <div className="geo-controls">
                            <label className="geo-auto-toggle">
                                <input
                                    type="checkbox"
                                    checked={autoApply}
                                    onChange={(e) => setAutoApply(e.target.checked)}
                                />
                                <span className="geo-toggle-slider" />
                                <span className="geo-toggle-text">Auto-Apply</span>
                            </label>
                            {!autoApply && (
                                <button className="geo-apply-btn" onClick={handleManualApply}>
                                    Apply to Simulator
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!weather && !loading && !error && (
                    <div className="geo-empty">
                        <span className="geo-empty-icon">📍</span>
                        <p>Click a location on the globe to fetch live weather data and apply it to the greenhouse simulation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export const GeoSimPanel = memo(GeoSimPanelComponent);
export default GeoSimPanel;
