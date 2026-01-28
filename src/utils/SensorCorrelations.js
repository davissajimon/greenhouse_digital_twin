/**
 * SensorCorrelations.js
 * 
 * Implements realistic correlations and HARD CONSTRAINTS for environmental sensors.
 * Enforces physics-based rules (e.g., impossible to have 40C and 90% RH).
 */

export const THRESHOLDS = {
    TEMP_EXTREME_HEAT: 40,
    TEMP_HEAT: 35,
    TEMP_COLD: 0,
    RH_SATURATED: 90,
    RH_HIGH: 85,
    RH_DRY: 20,
    SOIL_FROZEN: 0
};

/**
 * Applies realistic nudges and HARD LIMITS to the environment state.
 * 
 * @param {Object} state - Current { temperature, humidity, soil_moisture, soil_temperature, light ... }
 * @param {String} changedKey - The key of the slider the user just moved.
 * @returns {Object} { newState, adjusted: boolean, reasons: string[] }
 */
export function applyEdgeCorrections(state, changedKey) {
    let newState = { ...state };
    let adjusted = false;
    let reasons = [];

    const force = (key, val, msg) => {
        if (newState[key] !== val) {
            newState[key] = val;
            adjusted = true;
            if (!reasons.includes(msg)) reasons.push(msg);
        }
    };

    // Helper to nudge value towards target
    const nudge = (current, target, step = 0.5) => {
        if (Math.abs(target - current) < step) return target;
        return current < target ? current + step : current - step;
    };

    const t = newState.temperature;
    const rh = newState.humidity;
    const sm = newState.soil_moisture;
    const st = newState.soil_temperature;

    // --- PART 1: HARD CONSTRAINTS (IMPOSSIBLE WEATHER) ---

    // 1. Air Temp > 40°C with RH > 85% -> Impossible naturally (would be boiling steam/pressure cooker)
    if (t > 40 && rh > 85) {
        newState.humidity = 60; // Snap to realistic high-heat humidity
        adjusted = true;
        reasons.push("Physically impossible: >40°C with >85% RH. Reduced Humidity.");
    }

    // 2. Air Temp > 35°C with Soil Temp < 0°C -> Impossible (Ground limits air extreme diff)
    if (t > 35 && st < 0) {
        newState.soil_temperature = 15; // Ground warms up
        adjusted = true;
        reasons.push("Ground frozen while air is scorching is impossible.");
    }

    // 3. Air Temp < 0°C with Soil Temp > 20°C -> Unrealistic (unless heated floor, but assuming natural bias)
    if (t < 0 && st > 15) {
        newState.soil_temperature = 5; // Ground cools down
        adjusted = true;
        reasons.push("Ground cools down in freezing air.");
    }

    // 4. RH > 90% at High Temp (>35) without active condensation logic -> Cap it
    // Warm air holds more moisture, so 90% RH at 35C is an insane amount of water vapor.
    if (t > 35 && rh > 70) {
        newState.humidity = 70;
        adjusted = true;
        reasons.push("Capping RH at 70% for extreme heat.");
    }

    // 5. Dry Air (<20%) with Saturated Soil (>90%) -> Rapid Evaporation should drop soil or raise humidity
    if (rh < 20 && sm > 90) {
        // Raise humidity due to evaporation
        newState.humidity = 30;
        adjusted = true;
        reasons.push("Saturated soil moistens dry air.");
    }

    // --- PART 2: PARAMETER COUPLING (GRADUAL CORRELATION) ---

    // A. Extreme Heat (> 35)
    if (t > 35) {
        // Raises soil temp
        if (st < 25) {
            newState.soil_temperature = nudge(st, 28, 0.5);
            adjusted = true;
        }
        // Lowers soil moisture (Evap)
        if (sm > 20) {
            newState.soil_moisture = nudge(sm, sm - 0.5, 0.5); // Slow dry
            if (adjusted) reasons.push("Heat accelerates evaporation.");
        }
    }

    // B. Extreme Cold (< 5)
    if (t < 5) {
        // Stabilizes humidity (Cold air saturates easily) -> Push RH up if low
        if (rh < 50) {
            newState.humidity = nudge(rh, 60, 1);
            adjusted = true;
            reasons.push("Cold air relative humidity rises.");
        }
        // Soil freezes eventually
        if (st > 5) {
            newState.soil_temperature = nudge(st, 5, 0.5);
            adjusted = true;
        }
    }

    // C. Soil Influence
    if (changedKey === 'soil_temperature') {
        // If soil is frozen, air likely cold near ground
        if (st < 0 && t > 10) {
            newState.temperature = nudge(t, 5, 0.5);
            adjusted = true;
            reasons.push("Frozen ground cools the air.");
        }
    }

    // Rounding
    newState.temperature = Math.round(newState.temperature * 10) / 10;
    newState.soil_temperature = Math.round(newState.soil_temperature * 10) / 10;
    newState.humidity = Math.round(newState.humidity);
    newState.soil_moisture = Math.round(newState.soil_moisture);

    return { newState, adjusted, reasons };
}
