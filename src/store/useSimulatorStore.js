import { create } from 'zustand';
import { applyEdgeCorrections } from '../utils/SensorCorrelations';
import { weatherToSimulatorState } from '../modules/simulator/geoSimulatorBridge';

// Define initial control state
const INITIAL_CONTROLS = {
    temperature: 25,
    humidity: 50,
    soil_moisture: 45,
    soil_temperature: 20,
    light: 500
};

// Condition Presets (Moved from Simulator.jsx)
const CONDITION_PRESETS = {
    NORMAL: { temperature: 25, humidity: 60, soil_moisture: 50, soil_temperature: 20, light: 1000 },
    HEAT_STRESS: { temperature: 40, humidity: 40, soil_moisture: 40, soil_temperature: 25, light: 1500 },
    COLD_STRESS: { temperature: 8, humidity: 60, soil_moisture: 50, soil_temperature: 10, light: 800 },
    FROST: { temperature: -2, humidity: 40, soil_moisture: 30, soil_temperature: 0, light: 500 },
    HIGH_HUMIDITY: { temperature: 25, humidity: 95, soil_moisture: 60, soil_temperature: 20, light: 800 },
    DROUGHT: { temperature: 30, humidity: 30, soil_moisture: 10, soil_temperature: 25, light: 1500 },
    ROOT_COLD_STRESS: { temperature: 18, humidity: 60, soil_moisture: 50, soil_temperature: 10, light: 800 },
    ROOT_HEAT_STRESS: { temperature: 30, humidity: 50, soil_moisture: 40, soil_temperature: 40, light: 1200 },
    FLOWER_DROP: { temperature: 32, humidity: 30, soil_moisture: 40, soil_temperature: 25, light: 1200 },
    WATERLOGGING: { temperature: 25, humidity: 80, soil_moisture: 95, soil_temperature: 20, light: 800 },
};

export const useSimulatorStore = create((set, get) => ({
    // ── State ──
    plant: "tomato",
    controls: INITIAL_CONTROLS,
    geoWeather: null,

    // UI State
    controlsVisible: false,
    showConditions: false,
    plantInfoOpen: false,
    correlationMsg: null,

    // ── Actions ──

    setPlant: (plant) => set({ plant }),

    setControlsVisible: (visible) => set({ controlsVisible: visible }),
    setShowConditions: (show) => set({ showConditions: show }),
    setPlantInfoOpen: (open) => set({ plantInfoOpen: open }),

    // Message with timeout handled in the component usually, but we can do it here if we want.
    // Ideally, store just holds the message. The clearing logic is a side effect.
    // We'll expose a simple setter and let the component or a middleware handle timing, 
    // OR we can use a thunk-like pattern here since Zustand supports async actions.
    setCorrelationMsg: (msg) => set({ correlationMsg: msg }),

    showMsg: async (msg, dur = 3000) => {
        set({ correlationMsg: msg });
        // Clear any existing timeout? Zustand doesn't store timeout IDs easily without ref.
        // We'll just set a timeout. If multiple fire, it might flicker, but acceptable for now.
        setTimeout(() => {
            // Only clear if the message hasn't changed (simple concurrency check)
            if (get().correlationMsg === msg) {
                set({ correlationMsg: null });
            }
        }, dur);
    },

    // Complex Logic: Update a single control and apply physics corrections
    updateControl: (key, value) => {
        const currentControls = get().controls;
        const nextControls = { ...currentControls, [key]: Number(value) };

        // Apply Edge Corrections (Physics Engine)
        const { newState, adjusted, reasons } = applyEdgeCorrections(nextControls, key);

        set({ controls: newState });

        if (adjusted && reasons.length > 0) {
            get().showMsg(reasons[0] || "Adjusting for realism…", 3000);
        }
    },

    // Complex Logic: Apply a preset
    applyCondition: (key) => {
        const preset = CONDITION_PRESETS[key];
        if (preset) {
            set((state) => ({ controls: { ...state.controls, ...preset } }));
            get().showMsg(`Applying ${key.replace(/_/g, ' ')} …`, 2000);
        }
    },

    // Complex Logic: Apply Geo Weather
    setGeoWeather: (weather) => {
        const currentGeo = get().geoWeather;
        // Avoid redundant updates
        if (weather && weather !== currentGeo) {
            const simState = weatherToSimulatorState(weather);
            if (simState) {
                set((state) => ({
                    geoWeather: weather,
                    controls: { ...state.controls, ...simState }
                }));
                get().showMsg(`🌍 Applied conditions from ${weather.cityName || 'selected location'}`);
            } else {
                set({ geoWeather: weather });
            }
        }
    }
}));
