/**
 * weatherService.js
 * 
 * Fetches real-time weather data from OpenWeatherMap API.
 * Returns a normalized weather object for the greenhouse simulator.
 */

// Free-tier OpenWeatherMap API key — replace with your own for production
const OWM_API_KEY = '4d8fb5b93d4af21d66a2948710284366';

/**
 * Fetches current weather for a given latitude and longitude.
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<Object>} Normalized weather data
 */
export async function fetchWeather(lat, lon, signal) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize into the format our simulator expects
    return normalizeWeatherData(data);
}

/**
 * Normalizes raw OpenWeatherMap API response into a clean object.
 * 
 * @param {Object} raw - Raw API response
 * @returns {Object} Normalized weather data
 */
function normalizeWeatherData(raw) {
    const main = raw.main || {};
    const weather = (raw.weather && raw.weather[0]) || {};
    const wind = raw.wind || {};
    const clouds = raw.clouds || {};

    return {
        temperature: Math.round((main.temp ?? 25) * 10) / 10,
        humidity: Math.round(main.humidity ?? 50),
        pressure: Math.round(main.pressure ?? 1013),
        condition: weather.main || 'Clear',
        conditionDetail: weather.description || 'clear sky',
        conditionIcon: weather.icon || '01d',
        windSpeed: Math.round((wind.speed ?? 0) * 10) / 10,
        cloudCover: clouds.all ?? 0,
        cityName: raw.name || 'Unknown Location',
        country: raw.sys?.country || '',
        feelsLike: Math.round((main.feels_like ?? main.temp ?? 25) * 10) / 10,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Returns the OpenWeatherMap icon URL for a given icon code.
 * @param {string} iconCode 
 * @returns {string} URL to the weather icon
 */
export function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
