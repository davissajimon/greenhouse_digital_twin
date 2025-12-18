// Pea-specific sensor thresholds
export const PEA_THRESHOLDS = {
  temperature: {
    fatal: { min: -8, max: null },
    critical: { min: -8, max: -3 },
    warning: { min: -3, max: 25 },
    optimal: { min: 5, max: 28 },
  },
  humidity: {
    criticalLow: 35,
    low: 50,
    high: 70,
    criticalHigh: 85,
    optimal: { min: 55, max: 75 },
  },
  soil: {
    criticalLow: 25,
    low: 40,
    high: 65,
    criticalHigh: 75,
  },
  light: {
    low: 120,
    suboptimal: 200,
    high: 1000,
    criticalHigh: 1400,
  },
  co2: {
    criticalLow: 250,
    low: 300,
    high: 1000,
    criticalHigh: 1800,
  },
  pressure: {
    criticalLow: 970,
    low: 990,
    high: 1035,
    criticalHigh: 1045,
  },
};

export function getPeaAlerts(env) {
  const alerts = [];
  const t = Number(env.temperature);
  const h = Number(env.humidity);
  const s = Number(env.soil);
  const l = Number(env.light);
  const co2 = Number(env.co2);
  const p = Number(env.pressure);

  // Temperature (Pea is a cool-season crop)
  if (!Number.isNaN(t) && t >= 32) {
    alerts.push({ id: "heatstroke", sensor: "temperature", level: "critical", title: "Heatstroke", description: "≥ 32°C — severe stress & flowering failure." });
  } else if (!Number.isNaN(t) && t >= 25) {
    alerts.push({ id: "heatstress", sensor: "temperature", level: "warning", title: "Heat Stress", description: "25–31°C — reduced pod set & yield." });
  }
  if (!Number.isNaN(t) && t < 5 && t >= -3) {
    alerts.push({ id: "chilling", sensor: "temperature", level: "warning", title: "Chilling Injury", description: "-3 to 5°C — growth slowdown." });
  }
  if (!Number.isNaN(t) && t < -3 && t >= -8) {
    alerts.push({ id: "frostbite", sensor: "temperature", level: "critical", title: "Frostbite", description: "-8 to -3°C — tissue death likely." });
  }
  if (!Number.isNaN(t) && t < -8) {
    alerts.push({ id: "lethalfrost", sensor: "temperature", level: "fatal", title: "Lethal Frost", description: "< -8°C — lethal to plants." });
  }

  // Humidity
  if (!Number.isNaN(h) && h < 35) {
    alerts.push({ id: "hum_crit_low", sensor: "humidity", level: "critical", title: "Critical Low Humidity", description: "< 35% — Tissue dehydration stress." });
  } else if (!Number.isNaN(h) && h < 50) {
    alerts.push({ id: "hum_low", sensor: "humidity", level: "warning", title: "Low-Humidity Stress", description: "< 50% — transpiration stress." });
  }
  if (!Number.isNaN(h) && h > 85) {
    alerts.push({ id: "hum_crit_high", sensor: "humidity", level: "critical", title: "Critical High Humidity", description: "> 85% — severe disease risk." });
  } else if (!Number.isNaN(h) && h > 70) {
    alerts.push({ id: "hum_high", sensor: "humidity", level: "warning", title: "High-Humidity Stress", description: "> 70% — disease risk." });
  }
  if (!Number.isNaN(h) && h >= 55 && h <= 75) {
    alerts.push({ id: "hum_optimal", sensor: "humidity", level: "ok", title: "Optimal Humidity", description: "55–75% — favorable for growth." });
  }

  // Soil moisture
  if (!Number.isNaN(s) && s < 25) {
    alerts.push({ id: "soil_drought_critical", sensor: "soil", level: "critical", title: "Severe Drought (Soil)", description: "< 25% — severe water stress, immediate irrigation required." });
  } else if (!Number.isNaN(s) && s >= 25 && s < 40) {
    alerts.push({ id: "soil_drought_warn", sensor: "soil", level: "warning", title: "Low Soil Moisture", description: "25–39% — drought stress developing." });
  }
  if (!Number.isNaN(s) && s > 75) {
    alerts.push({ id: "soil_waterlog_critical", sensor: "soil", level: "critical", title: "Waterlogging (Soil)", description: "> 75% — roots may suffocate." });
  } else if (!Number.isNaN(s) && s > 65 && s <= 75) {
    alerts.push({ id: "soil_saturation_warn", sensor: "soil", level: "warning", title: "High Soil Moisture", description: "65–75% — near-saturation; monitor drainage." });
  }

  // Light
  if (!Number.isNaN(l) && l < 120) {
    alerts.push({ id: "light_low_warn", sensor: "light", level: "warning", title: "Low Light", description: "< 120 µmol/m²s — insufficient for good growth." });
  } else if (!Number.isNaN(l) && l >= 120 && l < 200) {
    alerts.push({ id: "light_subopt_warn", sensor: "light", level: "warning", title: "Suboptimal Light", description: "120–199 µmol/m²s — growth may be slower." });
  }
  if (!Number.isNaN(l) && l > 1400) {
    alerts.push({ id: "light_high_critical", sensor: "light", level: "critical", title: "Excessive Light", description: "> 1400 µmol/m²s — risk of photodamage." });
  } else if (!Number.isNaN(l) && l > 1000 && l <= 1400) {
    alerts.push({ id: "light_high_warn", sensor: "light", level: "warning", title: "High Light", description: "1000–1400 µmol/m²s — monitor for stress." });
  }

  // CO2
  if (!Number.isNaN(co2) && co2 < 250) {
    alerts.push({ id: "co2_verylow_critical", sensor: "co2", level: "critical", title: "Very Low CO₂", description: "< 250 ppm — severely limits photosynthesis." });
  } else if (!Number.isNaN(co2) && co2 >= 250 && co2 < 300) {
    alerts.push({ id: "co2_low_warn", sensor: "co2", level: "warning", title: "Low CO₂", description: "250–299 ppm — suboptimal for growth." });
  }
  if (!Number.isNaN(co2) && co2 > 1800) {
    alerts.push({ id: "co2_veryhigh_critical", sensor: "co2", level: "critical", title: "Very High CO₂", description: "> 1800 ppm — potentially harmful." });
  } else if (!Number.isNaN(co2) && co2 > 1000 && co2 <= 1800) {
    alerts.push({ id: "co2_high_warn", sensor: "co2", level: "warning", title: "High CO₂", description: "1000–1800 ppm — elevated CO₂; evaluate." });
  }

  // Pressure
  if (!Number.isNaN(p) && p < 970) {
    alerts.push({ id: "pressure_verylow_critical", sensor: "pressure", level: "critical", title: "Very Low Pressure", description: "< 970 hPa — may indicate extreme weather." });
  } else if (!Number.isNaN(p) && p >= 970 && p < 990) {
    alerts.push({ id: "pressure_low_warn", sensor: "pressure", level: "warning", title: "Low Pressure", description: "970–989 hPa — monitor for rapid changes." });
  }
  if (!Number.isNaN(p) && p > 1045) {
    alerts.push({ id: "pressure_veryhigh_critical", sensor: "pressure", level: "critical", title: "Very High Pressure", description: "> 1045 hPa — unusual; check sensors." });
  } else if (!Number.isNaN(p) && p > 1035 && p <= 1045) {
    alerts.push({ id: "pressure_high_warn", sensor: "pressure", level: "warning", title: "High Pressure", description: "1036–1045 hPa — monitor anomalies." });
  }

  return alerts;
}
