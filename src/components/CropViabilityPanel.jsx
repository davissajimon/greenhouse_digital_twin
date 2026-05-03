import React from 'react';
import { weatherToSimulatorState } from '../modules/simulator/geoSimulatorBridge';
import { evaluatePlantHealth, CONDITION_COLORS } from '../utils/PlantHealthEngine';

const PlantIcon = ({ color }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22S7 16 7 10a5 5 0 0 1 10 0c0 6-5 12-5 12z"/>
    <path d="M12 22V12"/>
    <path d="M12 16c-3 0-5-2-5-2"/>
    <path d="M12 14c3 0 5-2 5-2"/>
  </svg>
);

export const CropViabilityPanel = React.memo(({ geoWeather }) => {
  if (!geoWeather) return null;

  const simState = weatherToSimulatorState(geoWeather);

  const speciesList = [
    { id: 'tomato', name: 'Tomato' },
    { id: 'chilli', name: 'Chilli' }
  ];

  const results = speciesList.map(sp => {
    const health = evaluatePlantHealth({ ...simState, species: sp.id });
    
    // Determine verdict
    let verdict = 'Monitor';
    let verdictIcon = '⚠️';
    if (health.id === 'NORMAL') {
      verdict = 'Recommended';
      verdictIcon = '✔';
    }
    else if (['HEAT_STRESS', 'FROST', 'DROUGHT', 'ROOT_HEAT_STRESS'].includes(health.id)) {
      verdict = 'Not Viable';
      verdictIcon = '✕';
    }

    return { ...sp, health, verdict, verdictIcon };
  });

  return (
    <div className="crop-viability-panel">
      <div className="crop-viability-header">
        CROP VIABILITY — {geoWeather.cityName?.toUpperCase() || 'SELECTED LOCATION'}
      </div>
      <div className="crop-viability-grid">
        {results.map((res) => {
          const color = res.health.color || CONDITION_COLORS.NORMAL || '#2E8B57';
          return (
            <div key={res.id} className="crop-viability-card">
              <div className="crop-emoji"><PlantIcon color={color} /></div>
              <div className="crop-name">{res.name}</div>
              <div 
                className="crop-badge"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}40`,
                  color: color
                }}
              >
                {res.health.label}
              </div>
              <div className="crop-verdict" style={{ color: color }}>
                <span className="verdict-icon">{res.verdictIcon}</span> {res.verdict}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
