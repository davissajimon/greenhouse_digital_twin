import React from 'react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import './PlantMarquee.css';

const PLANTS = [
    { id: 'tomato', name: 'Tomato', color: '#ff6b6b' },
    { id: 'chilli', name: 'Chilli', color: '#ffb142' },
];

export function PlantMarquee() {
    const { plant, setPlant } = useSimulatorStore();

    return (
        <div className="plant-selector-container">
            <div className="plant-selector-list">
                {PLANTS.map((p) => (
                    <div
                        key={p.id}
                        className={`plant-item ${plant === p.id ? 'active' : ''}`}
                        onClick={() => setPlant(p.id)}
                        style={{ '--accent-color': p.color }}
                        title={`Select ${p.name}`}
                    >
                        <div className="plant-icon-box">
                            <span style={{ fontSize: '2rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p.id === 'tomato' && '🍅'}
                                {p.id === 'chilli' && '🌶️'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
