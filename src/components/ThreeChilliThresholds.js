// Chilli-specific sensor thresholds
export const CHILLI_THRESHOLDS = {
  temperature: {
    fatal: { min: -1, max: null },
    critical: { min: -1, max: 5 },
    warning: { min: 5, max: 35 },
    optimal: { min: 15, max: 40 },
  },
  humidity: {
    criticalLow: 30,
    low: 45,
    high: 75,
    criticalHigh: 90,
    optimal: { min: 50, max: 70 },
  },
  soil: {
    criticalLow: 20,
    low: 35,
    high: 70,
    criticalHigh: 80,
  },
  light: {
    low: 150,
    suboptimal: 250,
    high: 1400,
    criticalHigh: 1800,
  },
  co2: {
    criticalLow: 250,
    low: 300,
    high: 1200,
    criticalHigh: 2000,
  },
  pressure: {
    criticalLow: 970,
    low: 990,
    high: 1035,
    criticalHigh: 1045,
  },
};

export function getChilliAlerts(env) {
  const alerts = [];
  const t = Number(env.temperature);
  const h = Number(env.humidity);
  const s = Number(env.soil);
  const l = Number(env.light);
  const co2 = Number(env.co2);
  const p = Number(env.pressure);

  // Temperature (Chilli is more heat-tolerant than tomato)
  if (!Number.isNaN(t) && t >= 45) {
    alerts.push({ id: "heatstroke", sensor: "temperature", level: "critical", title: "Heatstroke", description: "≥ 45°C — severe leaf & fruit damage likely." });
  } else if (!Number.isNaN(t) && t >= 35) {
    alerts.push({ id: "heatstress", sensor: "temperature", level: "warning", title: "Heat Stress", description: "35–44°C — reduced growth rate." });
  }
  if (!Number.isNaN(t) && t < 15 && t >= 5) {
    alerts.push({ id: "chilling", sensor: "temperature", level: "warning", title: "Chilling Injury", description: "5–15°C — growth slowdown possible." });
  }
  if (!Number.isNaN(t) && t < 5 && t >= -1) {
    alerts.push({ id: "frostbite", sensor: "temperature", level: "critical", title: "Frostbite", description: "-1 to 5°C — tissue death likely." });
  }
  if (!Number.isNaN(t) && t < -1) {
    alerts.push({ id: "lethalfrost", sensor: "temperature", level: "fatal", title: "Lethal Frost", description: "< -1°C — lethal to plants." });
  }

  // Humidity
  if (!Number.isNaN(h) && h < 30) {
    alerts.push({ id: "hum_crit_low", sensor: "humidity", level: "critical", title: "Critical Low Humidity", description: "< 30% — Tissue dehydration & severe transpiration stress." });
  } else if (!Number.isNaN(h) && h < 45) {
    alerts.push({ id: "hum_low", sensor: "humidity", level: "warning", title: "Low-Humidity Stress", description: "< 45% — high transpiration & leaf drying." });
  }
  if (!Number.isNaN(h) && h > 90) {
    alerts.push({ id: "hum_crit_high", sensor: "humidity", level: "critical", title: "Critical High Humidity", description: "> 90% — condensation & disease risk." });
  } else if (!Number.isNaN(h) && h > 75) {
    alerts.push({ id: "hum_high", sensor: "humidity", level: "warning", title: "High-Humidity Stress", description: "> 75% — disease risk." });
  }
  if (!Number.isNaN(h) && h >= 50 && h <= 70) {
    alerts.push({ id: "hum_optimal", sensor: "humidity", level: "ok", title: "Optimal Humidity", description: "50–70% — favorable for growth." });
  }

  // Soil moisture
  if (!Number.isNaN(s) && s < 20) {
    alerts.push({ id: "soil_drought_critical", sensor: "soil", level: "critical", title: "Severe Drought (Soil)", description: "< 20% — severe water stress, immediate irrigation required." });
  } else if (!Number.isNaN(s) && s >= 20 && s < 35) {
    alerts.push({ id: "soil_drought_warn", sensor: "soil", level: "warning", title: "Low Soil Moisture", description: "20–34% — drought stress developing." });
  }
  if (!Number.isNaN(s) && s > 80) {
    alerts.push({ id: "soil_waterlog_critical", sensor: "soil", level: "critical", title: "Waterlogging (Soil)", description: "> 80% — roots may suffocate; risk of root rot." });
  } else if (!Number.isNaN(s) && s > 70 && s <= 80) {
    alerts.push({ id: "soil_saturation_warn", sensor: "soil", level: "warning", title: "High Soil Moisture", description: "70–80% — near-saturation; monitor drainage." });
  }

  // Light
  if (!Number.isNaN(l) && l < 150) {
    alerts.push({ id: "light_low_warn", sensor: "light", level: "warning", title: "Low Light", description: "< 150 µmol/m²s — insufficient for good photosynthesis." });
  } else if (!Number.isNaN(l) && l >= 150 && l < 250) {
    alerts.push({ id: "light_subopt_warn", sensor: "light", level: "warning", title: "Suboptimal Light", description: "150–249 µmol/m²s — growth may be slower." });
  }
  if (!Number.isNaN(l) && l > 1800) {
    alerts.push({ id: "light_high_critical", sensor: "light", level: "critical", title: "Excessive Light", description: "> 1800 µmol/m²s — risk of photodamage." });
  } else if (!Number.isNaN(l) && l > 1400 && l <= 1800) {
    alerts.push({ id: "light_high_warn", sensor: "light", level: "warning", title: "High Light", description: "1400–1800 µmol/m²s — watch for photoinhibition." });
  }

  // CO2
  if (!Number.isNaN(co2) && co2 < 250) {
    alerts.push({ id: "co2_verylow_critical", sensor: "co2", level: "critical", title: "Very Low CO₂", description: "< 250 ppm — severely limits photosynthesis." });
  } else if (!Number.isNaN(co2) && co2 >= 250 && co2 < 300) {
    alerts.push({ id: "co2_low_warn", sensor: "co2", level: "warning", title: "Low CO₂", description: "250–299 ppm — suboptimal for growth." });
  }
  if (!Number.isNaN(co2) && co2 > 2000) {
    alerts.push({ id: "co2_veryhigh_critical", sensor: "co2", level: "critical", title: "Very High CO₂", description: "> 2000 ppm — potentially phytotoxic." });
  } else if (!Number.isNaN(co2) && co2 > 1200 && co2 <= 2000) {
    alerts.push({ id: "co2_high_warn", sensor: "co2", level: "warning", title: "High CO₂", description: "1200–2000 ppm — elevated CO₂; evaluate cause." });
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
