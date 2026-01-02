/**
 * SensorCorrelations.js
 * 
 * Implements realistic correlations between environmental sensors.
 * Automatically nudges related values when one sensor moves into an extreme range.
 * 
 * Rules:
 * 1. High Air Temp (>38) -> Warns/Lowers Humidity, Raises Soil Temp, Lowers Soil Moisture
 * 2. Low Air Temp (<6) -> Warns/Raises Humidity, Lowers Soil Temp (but keeps buffer)
 * 3. High Soil Moisture (>90) -> Raises Humidity, Caps Soil Temp
 * 4. Low Soil Moisture (<15) -> Raises Air Temp, Lowers Humidity
 */

export const THRESHOLDS = {
    TEMP_HIGH: 38,
    TEMP_LOW: 6,
    SOIL_WET: 90,
    SOIL_DRY: 15
};

/**
 * Applies realistic nudges to the environment state based on the user's last change.
 * 
 * @param {Object} state - Current { temperature, humidity, soil_moisture, soil_temperature, light ... }
 * @param {String} changedKey - The key of the slider the user just moved.
 * @returns {Object} { newState, adjustments: boolean }
 */
export function applyEdgeCorrections(state, changedKey) {
    let newState = { ...state };
    let adjusted = false;
    let reasons = [];

    const nudge = (current, target, step = 0.5) => {
        if (Math.abs(target - current) < step) return target;
        return current < target ? current + step : current - step;
    };

    // 1. Check AIR TEMPERATURE Extremes
    if (changedKey === 'temperature') {
        const t = newState.temperature;

        // 🔥 Extreme Heat (> 38°C)
        if (t > THRESHOLDS.TEMP_HIGH) {
            // Nudge Soil Temp UP relative to air (Soil lags but eventually heats up)
            // Target: slightly cooler than air but high (e.g., T - 5)
            const targetSoilTemp = Math.max(newState.soil_temperature, t - 8);
            if (newState.soil_temperature < targetSoilTemp) {
                newState.soil_temperature = nudge(newState.soil_temperature, targetSoilTemp, 0.5);
                adjusted = true;
            }

            // Nudge Humidity DOWN (Heat dries air)
            // Target: < 45%
            if (newState.humidity > 45) {
                newState.humidity = nudge(newState.humidity, 45, 1.0);
                adjusted = true;
            }

            // Nudge Soil Moisture DOWN (Evaporation)
            // Target: Just lower than current
            if (newState.soil_moisture > 0) {
                newState.soil_moisture = nudge(newState.soil_moisture, newState.soil_moisture - 5, 0.2); // Slow dry
            }
            if (adjusted) reasons.push("Extreme Heat effects applied");
        }

        // 🥶 Extreme Cold (< 6°C)
        else if (t < THRESHOLDS.TEMP_LOW) {
            // Nudge Soil Temp DOWN but keep buffer (Earth retains heat better than air)
            // Rule: Soil Temp should be at least Air Temp + 2
            const targetSoilTemp = Math.max(t + 2, newState.soil_temperature - 1);

            // If soil is currently way hotter than max realistic for this cold air (e.g. air 0, soil 20), drop it
            if (newState.soil_temperature > t + 10) {
                newState.soil_temperature = nudge(newState.soil_temperature, t + 10, 0.5);
                adjusted = true;
            }

            // Nudge Humidity UP (Condensation risk in cold)
            // Target: > 60%
            if (newState.humidity < 60) {
                newState.humidity = nudge(newState.humidity, 60, 0.5);
                adjusted = true;
            }
            if (adjusted) reasons.push("Cold condensation effects applied");
        }
    }

    // 2. Check SOIL MOISTURE Extremes
    if (changedKey === 'soil_moisture') {
        const sm = newState.soil_moisture;

        // 💦 Extremely Wet (> 90%)
        if (sm > THRESHOLDS.SOIL_WET) {
            // Nudge Humidity UP (Evaporation from soil)
            if (newState.humidity < 80) {
                newState.humidity = nudge(newState.humidity, 80, 0.5);
                adjusted = true;
            }

            // Cap Soil Temp (Water buffers heat, extremely wet soil resists high heat)
            // If super hot, cool down slightly
            if (newState.soil_temperature > 25) {
                newState.soil_temperature = nudge(newState.soil_temperature, 25, 0.5);
                adjusted = true;
            }
            if (adjusted) reasons.push("Saturated soil effects applied");
        }

        // 🌵 Extremely Dry (< 15%)
        else if (sm < THRESHOLDS.SOIL_DRY) {
            // Nudge Air Temp UP? (Dry air often correlates, or lack of evap cooling)
            // Just a subtle nudge to suggest harshness
            if (newState.temperature < 30) {
                newState.temperature = nudge(newState.temperature, newState.temperature + 1, 0.1);
            }

            // Nudge Humidity DOWN (Dry soil = Dry air usually)
            if (newState.humidity > 30) {
                newState.humidity = nudge(newState.humidity, 30, 0.5);
                adjusted = true;
            }
            if (adjusted) reasons.push("Dry soil correlates applied");
        }
    }

    // Round values for UI cleanliness
    newState.temperature = Math.round(newState.temperature * 10) / 10;
    newState.soil_temperature = Math.round(newState.soil_temperature * 10) / 10;
    newState.humidity = Math.round(newState.humidity);
    newState.soil_moisture = Math.round(newState.soil_moisture);

    return { newState, adjusted, reasons };
}
