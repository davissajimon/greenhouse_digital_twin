/**
 * PlantHealthEngine.js
 * 
 * Logic to detect plant health conditions based on sensor environmental data.
 * Returns a condition key and formatted label.
 */

export const CONDITIONS = {
    NORMAL: "NORMAL",
    FROST: "FROST",
    HEAT_STRESS: "HEAT_STRESS",
    DROUGHT: "DROUGHT",
    ROOT_ROT: "ROOT_ROT",
    DISEASE_ZONE: "DISEASE_ZONE",
    MOLD_RISK: "MOLD_RISK",
    SUNSCALD: "SUNSCALD",
    SLOW_GROWTH: "SLOW_GROWTH",
    BLOSSOM_DROP: "BLOSSOM_DROP",
    WILTING_WET: "WILTING_WET"
};

/**
 * Evaluates the plant's health based on sensor data.
 * Priority: Top of the list is returned first if standard met.
 * 
 * @param {Object} data - { temperature, humidity, soil_moisture, soil_temperature }
 * @returns {Object} { id: CONDITION_KEY, label: "Readable String", color: "#hex" }
 */
export function evaluatePlantHealth(data) {
    if (!data) return { id: CONDITIONS.NORMAL, label: "Healthy", color: "#2E8B57" };

    const air_temp = Number(data.temperature);
    const humidity = Number(data.humidity);
    const soil_moisture = Number(data.soil_moisture);
    const soil_temp = Number(data.soil_temperature || data.temperature); // fallback

    // 1. Frost / Cold Stress (High Priority - Immediate Visual)
    if (air_temp < 10 || soil_temp < 12) {
        return { id: CONDITIONS.FROST, label: "Frost / Cold Stress", color: "#87CEEB" };
    }

    // 10. Wilting despite wet soil (Rare severe condition) -> Sim logic: Very high moisture + high heat = Boil/Rot
    // Re-interpreting prompt logic: soil > 85 & temp > 35 (extreme)
    if (soil_moisture > 90 && air_temp > 35) {
        return { id: CONDITIONS.WILTING_WET, label: "Hydraulic Failure (Wilt)", color: "#556B2F" };
    }

    // 2. Heat Stress / Leaf Scorch
    if (air_temp > 32 && humidity < 40) {
        return { id: CONDITIONS.HEAT_STRESS, label: "Heat Stress", color: "#DAA520" };
    }

    // 5. Sunscald (Specific high heat low moisture combo)
    if (air_temp > 33 && humidity < 35 && soil_moisture < 40) {
        return { id: CONDITIONS.SUNSCALD, label: "Sunscald Risk", color: "#FFE4B5" };
    }

    // 4. Drought Stress
    if (soil_moisture < 30 && air_temp > 28) {
        return { id: CONDITIONS.DROUGHT, label: "Drought Stress", color: "#CD853F" };
    }

    // 8. Root Rot
    if (soil_moisture > 85 && soil_temp > 20) {
        return { id: CONDITIONS.ROOT_ROT, label: "Root Rot Risk", color: "#3E2723" };
    }

    // 7. Condensation + Mold Risk
    if (humidity > 90) {
        return { id: CONDITIONS.MOLD_RISK, label: "Mold / Mildew Risk", color: "#708090" };
    }

    // 3. Disease Zone (Warm + Humid)
    if (air_temp > 25 && humidity > 80) {
        return { id: CONDITIONS.DISEASE_ZONE, label: "Fungal Disease Zone", color: "#BC8F8F" };
    }

    // 9. Slow Growth (Cold + Wet)
    if (soil_moisture > 70 && soil_temp < 15) {
        return { id: CONDITIONS.SLOW_GROWTH, label: "Stunted Growth (Cold/Wet)", color: "#8FBC8F" };
    }

    // 6. Blossom Drop (Extreme temps)
    if (air_temp > 35 || air_temp < 12) {
        return { id: CONDITIONS.BLOSSOM_DROP, label: "Blossom Drop Risk", color: "#FFDAB9" };
    }

    return { id: CONDITIONS.NORMAL, label: "Optimal Condition", color: "#2E8B57" };
}
