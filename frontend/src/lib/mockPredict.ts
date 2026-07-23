import type { PredictionResult, RiskPrediction, ForecastDay } from '../types';

function getRiskLevel(percent: number): 'Low' | 'Medium' | 'High' {
  if (percent < 35) return 'Low';
  if (percent < 65) return 'Medium';
  return 'High';
}

function generateForecast(): ForecastDay[] {
  const conditions = ['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Clear'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp_max: Math.round(20 + Math.random() * 20),
      temp_min: Math.round(10 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 50),
      rainfall: Math.round(Math.random() * 30),
      wind_speed: Math.round(5 + Math.random() * 40),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
    };
  });
}

export async function mockPredict(lat: number, lon: number, locationName: string): Promise<PredictionResult> {
  await new Promise(resolve => setTimeout(resolve, 1800));

  const seed = (lat * 31 + lon * 17) % 100;
  const abs = Math.abs(seed);

  const floodPct = Math.round(20 + (abs % 60));
  const wildfirePct = Math.round(15 + ((abs * 1.3) % 70));
  const landslidePct = Math.round(10 + ((abs * 0.7) % 55));
  const earthquakePct = Math.round(5 + ((abs * 2.1) % 45));
  const hurricanePct = Math.round(10 + ((abs * 0.9) % 60));

  const flood: RiskPrediction = {
    risk_percent: floodPct,
    risk_level: getRiskLevel(floodPct),
    insight: floodPct > 60
      ? 'Prolonged rainfall and saturated soils elevate flood susceptibility significantly.'
      : floodPct > 35
      ? 'Moderate precipitation patterns indicate potential surface water accumulation.'
      : 'Conditions show relatively low flood-triggering factors at this time.',
    interpretation: 'Environment shows risk indicators, not necessarily an active flood event.',
    safety_advice: [
      'Identify nearest elevated ground and keep evacuation routes mapped.',
      'Store emergency kit with 72-hour water, food, and medication supply.',
      'Monitor local water authority alerts and river level updates regularly.',
    ],
    forecast: generateForecast(),
  };

  const wildfire: RiskPrediction = {
    risk_percent: wildfirePct,
    risk_level: getRiskLevel(wildfirePct),
    insight: wildfirePct > 60
      ? 'Dry and hot conditions with low humidity are increasing fire susceptibility.'
      : wildfirePct > 35
      ? 'Moderate dryness and vegetation density present some fire risk.'
      : 'Adequate moisture levels are currently suppressing wildfire potential.',
    interpretation: 'Risk reflects environmental conditions, not an active wildfire.',
    safety_advice: [
      'Clear defensible space of at least 30ft around your home.',
      'Avoid outdoor burning during high-wind or dry weather days.',
      'Keep emergency go-bag ready with documents and essentials.',
    ],
    forecast: generateForecast(),
  };

  const landslide: RiskPrediction = {
    risk_percent: landslidePct,
    risk_level: getRiskLevel(landslidePct),
    insight: landslidePct > 60
      ? 'Steep terrain combined with recent rainfall may destabilize slopes.'
      : landslidePct > 35
      ? 'Soil saturation on moderate slopes poses a watchful risk.'
      : 'Terrain and soil stability currently present low landslide concern.',
    interpretation: 'Assessment based on terrain and rainfall patterns, not confirmed movement.',
    safety_advice: [
      'Avoid building or camping near cliff bases and steep hillsides.',
      'Watch for cracking soil, leaning trees, or unusual slope sounds.',
      'Have an evacuation plan if located in hilly or mountainous terrain.',
    ],
    forecast: generateForecast(),
  };

  const earthquake: RiskPrediction = {
    risk_percent: earthquakePct,
    risk_level: getRiskLevel(earthquakePct),
    insight: earthquakePct > 60
      ? 'Location near active fault lines warrants heightened seismic awareness.'
      : earthquakePct > 35
      ? 'Moderate seismic activity has been historically recorded in this region.'
      : 'Current seismic baseline suggests low immediate earthquake activity.',
    interpretation: 'Seismic risk reflects geological baseline, not an imminent earthquake.',
    safety_advice: [
      'Secure heavy furniture and appliances to walls.',
      'Practice Drop, Cover, and Hold-On drills with household members.',
      'Keep emergency supplies including water purification tablets.',
    ],
    forecast: generateForecast(),
  };

  const hurricane: RiskPrediction = {
    risk_percent: hurricanePct,
    risk_level: getRiskLevel(hurricanePct),
    insight: hurricanePct > 60
      ? 'Warm sea surface temperatures and favorable wind patterns elevate hurricane risk.'
      : hurricanePct > 35
      ? 'Seasonal conditions partially support tropical storm development nearby.'
      : 'Current atmospheric patterns show low tropical cyclone formation potential.',
    interpretation: 'Risk indicates atmospheric conditions, not a confirmed storm system.',
    safety_advice: [
      'Board up windows and reinforce doors ahead of storm season.',
      'Know your evacuation zone and local shelter locations.',
      'Stockpile non-perishable food, water, and battery-powered radio.',
    ],
    forecast: generateForecast(),
  };

  return {
    location: { full_name: locationName, lat, lon },
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    predictions: { flood, wildfire, landslide, earthquake, hurricane },
  };
}

export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name };
  } catch {
    return null;
  }
}
