import React from 'react';
import { useSimulatorStore } from '../store/useSimulatorStore';
import './PlantMarquee.css';

const PLANTS = [
    { id: 'tomato', name: 'Tomato', color: '#ff6b6b' },
    { id: 'chilli', name: 'Chilli', color: '#ffb142' },
    { id: 'okra', name: 'Okra', color: '#2ed573' },
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
                        {/* Removed the background gradient box completely */}
                        <div className="plant-icon-box">
                            <span style={{ fontSize: '2rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {p.id === 'tomato' && '🍅'}
                                {p.id === 'chilli' && '🌶️'}
                                {p.id === 'okra' && (
                                    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                                        {/* Okra Body: Long, Tapered, Ribbed - Lady Finger Shape */}
                                        {/* Main Body */}
                                        <path d="M50 8 Q 70 20 62 55 Q 58 90 50 95 Q 42 90 38 55 Q 30 20 50 8 Z" fill="#7CB342" stroke="#558B2F" strokeWidth="2" />

                                        {/* Longitudinal Ribs/Facets */}
                                        <path d="M50 8 L 50 95" stroke="#4C8C2B" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M42 20 Q 42 50 45 80" stroke="#4C8C2B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                        <path d="M58 20 Q 58 50 55 80" stroke="#4C8C2B" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                                        {/* Cap / Stem */}
                                        <path d="M46 8 L 46 2 L 54 2 L 54 8" fill="#558B2F" stroke="#33691E" strokeWidth="1" />
                                    </svg>
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
