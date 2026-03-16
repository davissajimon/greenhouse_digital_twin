import React from 'react';
import { weatherToSimulatorState } from '../modules/simulator/geoSimulatorBridge';
import { evaluatePlantHealth, CONDITION_COLORS } from '../utils/PlantHealthEngine';
import './ForecastStrip.css';

export const ForecastStrip = React.memo(({ forecastData, activePlant }) => {
  if (!forecastData || forecastData.length === 0) return null;

  return (
    <div className="forecast-strip-container">
      <div className="forecast-header">3-DAY STRESS FORECAST</div>
      <div className="forecast-strip">
        {forecastData.map((day, idx) => {
          // Convert to sim state
          const simState = weatherToSimulatorState({
            temperature: day.temp,
            humidity: day.humidity,
            condition: day.condition,
            cloudCover: day.cloudCover
          });

          // Evaluate plant health
          const health = evaluatePlantHealth({ ...simState, species: activePlant || 'tomato' });
          const color = health.color || CONDITION_COLORS.NORMAL || '#2E8B57';

          return (
            <div key={idx} className="forecast-day-card">
              <div className="forecast-day-name">{day.date}</div>
              <img 
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} 
                alt={day.condition} 
                className="forecast-icon"
                width="36" height="36"
              />
              <div className="forecast-temp">{Math.round(day.temp)}°C</div>
              <div 
                className="forecast-badge"
                style={{
                  backgroundColor: `${color}22`,
                  border: `1px solid ${color}55`,
                  color: color
                }}
              >
                {health.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
