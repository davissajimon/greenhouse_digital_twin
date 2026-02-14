/**
 * geoSimulatorBridge.js
 * 
 * Converts fetched weather data → greenhouse simulator environment state.
 * Maps real-world weather conditions to internal simulator parameters.
 */

/**
 * Converts weather API data into greenhouse simulator controls state.
 * 
 * @param {Object} weather - Normalized weather object from weatherService
 * @returns {Object} Simulator controls: { temperature, humidity, soil_moisture, soil_temperature, light }
 */
export function weatherToSimulatorState(weather) {
    if (!weather) return null;

    const temperature = weather.temperature ?? 25;
    const humidity = weather.humidity ?? 50;
    const condition = (weather.condition || '').toLowerCase();
    const cloudCover = weather.cloudCover ?? 0;
    const windSpeed = weather.windSpeed ?? 0;

    // --- Soil Moisture Heuristic ---
    // Based on weather condition + humidity
    let soil_moisture = 50; // default moderate
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
        soil_moisture = 70 + Math.min(humidity * 0.2, 20); // Rainy = Wet soil
    } else if (condition.includes('snow')) {
        soil_moisture = 60; // Snow melting slowly
    } else if (condition.includes('clear') && humidity < 30) {
        soil_moisture = 25; // Dry conditions
    } else if (condition.includes('clouds')) {
        soil_moisture = 45 + humidity * 0.15;
    } else {
        soil_moisture = 30 + humidity * 0.3;
    }

    // --- Soil Temperature Heuristic ---
    // Soil temperature lags behind air temperature and is moderated
    let soil_temperature = temperature * 0.7 + 8; // Buffered towards moderate
    if (temperature < 0) {
        soil_temperature = Math.max(temperature * 0.5, -5); // Ground freezes slower
    }
    if (temperature > 35) {
        soil_temperature = Math.min(temperature * 0.8, 40); // Ground doesn't get AS hot
    }

    // --- Light Intensity Heuristic ---
    // Based on cloud cover, condition, and time approximation
    let light = 1200; // Default sunny day
    if (cloudCover > 80) {
        light = 300 + (100 - cloudCover) * 5; // Heavy overcast
    } else if (cloudCover > 50) {
        light = 600 + (100 - cloudCover) * 8; // Partly cloudy
    } else if (cloudCover > 20) {
        light = 900 + (100 - cloudCover) * 5; // Light clouds
    } else {
        light = 1300 + Math.random() * 200; // Clear sky, bright
    }

    // Rain/Snow reduces light
    if (condition.includes('rain') || condition.includes('thunderstorm')) {
        light *= 0.5;
    } else if (condition.includes('snow') || condition.includes('mist') || condition.includes('fog')) {
        light *= 0.4;
    }

    // Clamp values
    soil_moisture = Math.round(Math.max(0, Math.min(100, soil_moisture)));
    soil_temperature = Math.round(Math.max(-5, Math.min(45, soil_temperature)) * 10) / 10;
    light = Math.round(Math.max(0, Math.min(2000, light)));

    return {
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(Math.max(0, Math.min(100, humidity))),
        soil_moisture,
        soil_temperature,
        light,
    };
}

/**
 * Determines the plant health condition label based on weather data.
 * This is a simplified version for the UI weather panel tooltip.
 * 
 * @param {Object} weather - Normalized weather object
 * @returns {string} Quick condition summary
 */
export function getWeatherImpactSummary(weather) {
    if (!weather) return 'No data';

    const t = weather.temperature;
    const h = weather.humidity;

    if (t <= 1) return '🥶 Frost Danger — Critical risk to all crops';
    if (t < 12) return '❄️ Cold Stress — Growth significantly slowed';
    if (t >= 40) return '🔥 Extreme Heat — Severe heat stress likely';
    if (t >= 35) return '🌡️ Heat Stress — Plants may wilt and drop flowers';
    if (h > 90) return '💧 Very High Humidity — Fungal disease risk';
    if (h > 85) return '🌫️ High Humidity — Monitor for mold';
    if (h < 20) return '🏜️ Very Dry Air — Drought stress possible';
    if (t >= 30 && h < 40) return '🌸 Flower Drop Risk — Hot and dry conditions';
    if (t >= 20 && t <= 30 && h >= 40 && h <= 80) return '✅ Optimal — Good growing conditions';
    return '📊 Moderate — Acceptable growing conditions';
}
