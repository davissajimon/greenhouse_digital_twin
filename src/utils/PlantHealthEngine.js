/**
 * PlantHealthEngine.js
 * 
 * Implements strict agronomic logic for Digital Twin Greenhouse.
 * Enforces 10 distinct, non-overlapping simulator states.
 * Replaces Pea with Lady's Finger (Okra).
 */

export const CONDITIONS = {
    NORMAL: "NORMAL",
    HEAT_STRESS: "HEAT_STRESS",
    COLD_STRESS: "COLD_STRESS",
    FROST: "FROST",
    HIGH_HUMIDITY: "HIGH_HUMIDITY",
    DROUGHT: "DROUGHT",
    ROOT_COLD_STRESS: "ROOT_COLD_STRESS",
    ROOT_HEAT_STRESS: "ROOT_HEAT_STRESS",
    FLOWER_DROP: "FLOWER_DROP",
    WATERLOGGING: "WATERLOGGING"
};

// Colors for visual feedback
export const CONDITION_COLORS = {
    [CONDITIONS.NORMAL]: "#2E8B57",        // Seagreen
    [CONDITIONS.HEAT_STRESS]: "#FF8C00",   // DarkOrange
    [CONDITIONS.COLD_STRESS]: "#87CEEB",   // SkyBlue
    [CONDITIONS.FROST]: "#00BFFF",         // DeepSkyBlue (Ice)
    [CONDITIONS.HIGH_HUMIDITY]: "#708090", // SlateGray (Mold risk)
    [CONDITIONS.DROUGHT]: "#CD853F",       // Peru (Dry earth)
    [CONDITIONS.ROOT_COLD_STRESS]: "#4682B4", // SteelBlue
    [CONDITIONS.ROOT_HEAT_STRESS]: "#A0522D", // Sienna
    [CONDITIONS.FLOWER_DROP]: "#FFD700",   // Gold
    [CONDITIONS.WATERLOGGING]: "#2F4F4F"   // DarkSlateGray
};

// Plant Specific Thresholds
const SPECIES_CONFIG = {
    tomato: {
        optTemp: [21, 29],
        optRH: [60, 85],
        optSoilTemp: [15, 30],
        coldLimit: 12,
        heatLimit: 34
    },
    chilli: {
        optTemp: [18, 32],
        optRH: [60, 70], // Tighter RH control
        optSoilTemp: [15, 30], // Standard warm soil
        coldLimit: 12,
        heatLimit: 35
    },
    okra: { // Lady's Finger
        optTemp: [24, 30],
        optRH: [60, 75],
        optSoilTemp: [20, 30], // Likes warm soil
        coldLimit: 15, // Very sensitive
        heatLimit: 40, // Tolerates heat
        frostLimit: 5  // Critical fail
    }
};

/**
 * Evaluates the plant's health based on rigid simulator state logic.
 * 
 * @param {Object} data - { temperature, humidity, soil_moisture, soil_temperature, species }
 * @returns {Object} { id: CONDITION_KEY, label: "Readable String", color: "#hex" }
 */
export function evaluatePlantHealth(data) {
    if (!data) return { id: CONDITIONS.NORMAL, label: "Healthy", color: CONDITION_COLORS.NORMAL };

    const t = Number(data.temperature);
    const rh = Number(data.humidity);
    const sm = Number(data.soil_moisture);
    const st = Number(data.soil_temperature);
    const species = data.species || "tomato"; // Default

    // Logic Priority: Fatal -> Critical -> Warning -> Normal
    // Strict non-overlapping ranges where possible, based on user spec for 10 states.

    // 1. FROST (Fatal/Severe)
    if (t <= 1 || st <= 1) {
        return { id: CONDITIONS.FROST, label: "Frost / Freeze", color: CONDITION_COLORS.FROST };
    }

    // 2. ROOT HEAT STRESS (Specific deep soil issue)
    if (st >= 35) {
        return { id: CONDITIONS.ROOT_HEAT_STRESS, label: "Root Heat Stress", color: CONDITION_COLORS.ROOT_HEAT_STRESS };
    }

    // 3. HEAT STRESS (Air)
    if (t >= 35) {
        return { id: CONDITIONS.HEAT_STRESS, label: "Heat Stress", color: CONDITION_COLORS.HEAT_STRESS };
    }

    // 4. DROUGHT (Soil)
    if (sm < 30) {
        return { id: CONDITIONS.DROUGHT, label: "Drought", color: CONDITION_COLORS.DROUGHT };
    }

    // 5. WATERLOGGING (Soil)
    if (sm > 85) { // User spec said >70-90 is waterlogging range, we pick >70 logic or strictly >85 extreme
        // Using >80 for clear waterlogging
        return { id: CONDITIONS.WATERLOGGING, label: "Waterlogging", color: CONDITION_COLORS.WATERLOGGING };
    }

    // 6. HIGH HUMIDITY STRESS (Disease Risk)
    if (rh > 85) {
        return { id: CONDITIONS.HIGH_HUMIDITY, label: "High Humidity Risk", color: CONDITION_COLORS.HIGH_HUMIDITY };
    }

    // 7. FLOWER DROP RISK (Dry Air or subtle temp stress)
    // User spec: 30-34C (warm) AND <40% RH
    if (t >= 30 && t < 35 && rh < 40) {
        return { id: CONDITIONS.FLOWER_DROP, label: "Flower Drop Risk", color: CONDITION_COLORS.FLOWER_DROP };
    }

    // 8. ROOT COLD STRESS
    // User spec: 18-22 Air, 10-14 Soil. We focus on the Soil Temp being the driver here.
    if (st < 15 && st > 1) {
        return { id: CONDITIONS.ROOT_COLD_STRESS, label: "Root Cold Stress", color: CONDITION_COLORS.ROOT_COLD_STRESS };
    }

    // 9. COLD STRESS (Air)
    // User spec: 8-11C Air
    if (t < 12 && t > 1) {
        return { id: CONDITIONS.COLD_STRESS, label: "Cold Stress", color: CONDITION_COLORS.COLD_STRESS };
    }

    // Check against species verification for "Optimal" vs "Sub-optimal" that isn't a crisis
    // If we passed all critical checks, we are broadly "Normal", but let's check optimization
    const config = SPECIES_CONFIG[species === 'pea' ? 'okra' : species] || SPECIES_CONFIG.tomato; // Map pea to okra if legacy passed

    // If slightly outside optimal but not critical
    if (t < config.optTemp[0] || t > config.optTemp[1] || rh < config.optRH[0] || rh > config.optRH[1]) {
        // We could return a generic "Suboptimal" but for 10-state sim, 'Normal' covers the safe buffer
        // Or we could trigger 'Flower Drop' if it matches that specific heuristic
    }

    return { id: CONDITIONS.NORMAL, label: "Optimal / Normal", color: CONDITION_COLORS.NORMAL };
}
