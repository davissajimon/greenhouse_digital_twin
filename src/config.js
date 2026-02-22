// For Vercel, the API and frontend share the same domain. 
// We use /api relative path in production, and fallback to localhost/external for dev.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : "https://greenhouse-digital-twin.onrender.com");
