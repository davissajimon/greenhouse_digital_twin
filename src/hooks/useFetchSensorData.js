import { useState, useEffect, useRef, useCallback } from 'react';
import { SENSOR_API_URL } from '../config';

const POLL_INTERVAL = 3000;

export function useFetchSensorData(species, sensorId) {
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState(null);

    // Use refs to avoid effect re-triggering issues
    const paramsRef = useRef({ species, sensorId });
    useEffect(() => { paramsRef.current = { species, sensorId }; }, [species, sensorId]);

    const fetchData = useCallback(async (signal) => {
        const { species, sensorId } = paramsRef.current;
        if (!species || !sensorId) return;

        try {
            const res = await fetch(`${SENSOR_API_URL}/get_data/${species}/${sensorId}`, { signal });

            if (!res.ok) {
                if (res.status === 404) throw new Error("Sensor/Plant not found");
                throw new Error(`Server Error: ${res.status}`);
            }

            const json = await res.json();

            // Validation / Sanitization
            if (!json || typeof json !== 'object') throw new Error("Invalid data format");

            // Normalize data structure
            const normalized = {
                temperature: Number(json.universal?.room_temperature || 0),
                humidity: Number(json.universal?.room_humidity || 0),
                soil_moisture: Number(json.plant?.soil_moisture || 0),
                soil_temperature: Number(json.plant?.temperature || 0),
                light_intensity: Number(json.universal?.light_intensity || 0),
                air_quality: Number(json.universal?.air_quality || 0),
            };

            setData(normalized);
            setStatus('success');
            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("Fetch error:", err);
            setError(err.message);
            // Don't set status to 'error' immediately on transient failures to keep UI stable,
            // but we store the error message.
        }
    }, []);

    useEffect(() => {
        if (!species || !sensorId) {
            setStatus('idle');
            return;
        }

        setStatus('loading');
        const controller = new AbortController();

        // Initial fetch
        fetchData(controller.signal);

        // Polling interaction
        const intervalId = setInterval(() => {
            fetchData(controller.signal);
        }, POLL_INTERVAL);

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [species, sensorId, fetchData]);

    return { data, status, error };
}
