// Tomato-specific sensor thresholds
export const TOMATO_THRESHOLDS = {
  temperature: {
    fatal: { min: -2, max: null },
    critical: { min: 0, max: -2 },
    warning: { min: 10, max: 30 },
    optimal: { min: 10, max: 35 },
  },
  humidity: {
    criticalLow: 25,
    low: 40,
    high: 80,
    criticalHigh: 95,
    optimal: { min: 60, max: 70 },
  },
  soil: {
    criticalLow: 15,
    low: 30,
    high: 70,
    criticalHigh: 85,
  },
  light: {
    low: 100,
    suboptimal: 200,
    high: 1200,
    criticalHigh: 1600,
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

export function getTomatoAlerts(env) {
  const alerts = [];
  const t = Number(env.temperature);
  const h = Number(env.humidity);
  const s = Number(env.soil);
  const l = Number(env.light);
  const co2 = Number(env.co2);
  const p = Number(env.pressure);

  // Temperature
  if (!Number.isNaN(t) && t >= 40) {
    alerts.push({ id: "heatstroke", sensor: "temperature", level: "critical", title: "Heatstroke", description: "≥ 40°C — severe leaf & fruit damage likely." });
  } else if (!Number.isNaN(t) && t >= 30) {
    alerts.push({ id: "heatstress", sensor: "temperature", level: "warning", title: "Heat Stress", description: "30–39°C — poor pollination & slowed growth." });
  }
  if (!Number.isNaN(t) && t < 10 && t >= 0) {
    alerts.push({ id: "chilling", sensor: "temperature", level: "warning", title: "Chilling Injury", description: "< 10°C — growth slowdown possible." });
  }
  if (!Number.isNaN(t) && t < 0 && t >= -2) {
    alerts.push({ id: "frostbite", sensor: "temperature", level: "critical", title: "Frostbite", description: "0 to -2°C — tissue death likely." });
  }
  if (!Number.isNaN(t) && t < -2) {
    alerts.push({ id: "lethalfrost", sensor: "temperature", level: "fatal", title: "Lethal Frost", description: "< -2°C — lethal to plants." });
  }

  // Humidity
  if (!Number.isNaN(h) && h < 25) {
    alerts.push({ id: "hum_crit_low", sensor: "humidity", level: "critical", title: "Critical Low Humidity", description: "< 25% — Tissue dehydration & severe transpiration stress." });
  } else if (!Number.isNaN(h) && h < 40) {
    alerts.push({ id: "hum_low", sensor: "humidity", level: "warning", title: "Low-Humidity Stress", description: "< 40% — high transpiration & leaf drying." });
  }
  if (!Number.isNaN(h) && h > 95) {
    alerts.push({ id: "hum_crit_high", sensor: "humidity", level: "critical", title: "Critical High Humidity", description: "> 95% — condensation & severe disease risk." });
  } else if (!Number.isNaN(h) && h > 80) {
    alerts.push({ id: "hum_high", sensor: "humidity", level: "warning", title: "High-Humidity Stress", description: "> 80% — poor fruit set & disease risk." });
  }
  if (!Number.isNaN(h) && h >= 60 && h <= 70) {
    alerts.push({ id: "hum_optimal", sensor: "humidity", level: "ok", title: "Optimal Humidity", description: "60–70% — favorable for pollination and growth." });
  }

  // Soil moisture
  if (!Number.isNaN(s) && s < 15) {
    alerts.push({ id: "soil_drought_critical", sensor: "soil", level: "critical", title: "Severe Drought (Soil)", description: "< 15% — severe water stress, immediate irrigation required." });
  } else if (!Number.isNaN(s) && s >= 15 && s < 30) {
    alerts.push({ id: "soil_drought_warn", sensor: "soil", level: "warning", title: "Low Soil Moisture", description: "15–29% — drought stress developing." });
  }
  if (!Number.isNaN(s) && s > 85) {
    alerts.push({ id: "soil_waterlog_critical", sensor: "soil", level: "critical", title: "Waterlogging (Soil)", description: "> 85% — roots may suffocate; risk of root rot." });
  } else if (!Number.isNaN(s) && s > 70 && s <= 85) {
    alerts.push({ id: "soil_saturation_warn", sensor: "soil", level: "warning", title: "High Soil Moisture", description: "70–85% — near-saturation; monitor drainage." });
  }

  // Light
  if (!Number.isNaN(l) && l < 100) {
    alerts.push({ id: "light_low_warn", sensor: "light", level: "warning", title: "Low Light", description: "< 100 µmol/m²s — insufficient for good photosynthesis." });
  } else if (!Number.isNaN(l) && l >= 100 && l < 200) {
    alerts.push({ id: "light_subopt_warn", sensor: "light", level: "warning", title: "Suboptimal Light", description: "100–199 µmol/m²s — growth may be slower." });
  }
  if (!Number.isNaN(l) && l > 1600) {
    alerts.push({ id: "light_high_critical", sensor: "light", level: "critical", title: "Excessive Light", description: "> 1600 µmol/m²s — risk of photodamage/leaf scorch." });
  } else if (!Number.isNaN(l) && l > 1200 && l <= 1600) {
    alerts.push({ id: "light_high_warn", sensor: "light", level: "warning", title: "High Light", description: "1200–1600 µmol/m²s — watch for photoinhibition + heat." });
  }

  // CO2
  if (!Number.isNaN(co2) && co2 < 250) {
    alerts.push({ id: "co2_verylow_critical", sensor: "co2", level: "critical", title: "Very Low CO₂", description: "< 250 ppm — severely limits photosynthesis." });
  } else if (!Number.isNaN(co2) && co2 >= 250 && co2 < 300) {
    alerts.push({ id: "co2_low_warn", sensor: "co2", level: "warning", title: "Low CO₂", description: "250–299 ppm — suboptimal for growth." });
  }
  if (!Number.isNaN(co2) && co2 > 2000) {
    alerts.push({ id: "co2_veryhigh_critical", sensor: "co2", level: "critical", title: "Very High CO₂", description: "> 2000 ppm — potentially phytotoxic and hazardous to workers." });
  } else if (!Number.isNaN(co2) && co2 > 1200 && co2 <= 2000) {
    alerts.push({ id: "co2_high_warn", sensor: "co2", level: "warning", title: "High CO₂", description: "1200–2000 ppm — elevated CO₂; evaluate cause." });
  }

  // Pressure
  if (!Number.isNaN(p) && p < 970) {
    alerts.push({ id: "pressure_verylow_critical", sensor: "pressure", level: "critical", title: "Very Low Pressure", description: "< 970 hPa — may indicate extreme weather." });
  } else if (!Number.isNaN(p) && p >= 970 && p < 990) {
    alerts.push({ id: "pressure_low_warn", sensor: "pressure", level: "warning", title: "Low Pressure", description: "970–989 hPa — monitor for rapid environmental changes." });
  }
  if (!Number.isNaN(p) && p > 1045) {
    alerts.push({ id: "pressure_veryhigh_critical", sensor: "pressure", level: "critical", title: "Very High Pressure", description: "> 1045 hPa — unusual; check sensors & forecasts." });
  } else if (!Number.isNaN(p) && p > 1035 && p <= 1045) {
    alerts.push({ id: "pressure_high_warn", sensor: "pressure", level: "warning", title: "High Pressure", description: "1036–1045 hPa — monitor anomalies." });
  }

  return alerts;
}
