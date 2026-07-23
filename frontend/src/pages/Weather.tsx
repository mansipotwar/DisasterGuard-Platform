import { ArrowDown, ArrowUp, Droplets, Eye, Gauge, Loader, MapPin, Search, Thermometer, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { geocodeLocation } from '../lib/mockPredict';

interface WeatherData {
  location: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  rainfall: number;
  condition: string;
  conditionIcon: string;
  high: number;
  low: number;
  uvIndex: number;
  dewPoint: number;
}

// ── Backend config ──────────────────────────────────────────────────────────
const BACKEND_URL = "http://localhost:5000";

function mapBackendToUI(data: any, locationName: string): WeatherData {
  const temp = Math.round(data.temperature);
  return {
    location: locationName.split(',').slice(0, 2).join(',').trim(),
    temp,
    feelsLike: temp,
    humidity: Math.round(data.humidity),
    windSpeed: Math.round(data.wind_speed),
    pressure: Math.round(data.pressure),
    visibility: data.visibility ?? 10,
    rainfall: Math.round(data.rainfall || 0),
    condition: "Live Weather",
    conditionIcon: "🌤️",
    high: temp + 2,
    low: temp - 2,
    uvIndex: data.uv_index ?? 5,
    dewPoint: data.dew_point ?? temp - 3,
  };
}

// ── Helper UI pieces (unchanged from doc 1) ─────────────────────────────────
function MetricCard({ icon, label, value, sub, accent = '#14b8a6' }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="glass-card" style={{ borderRadius: '0.875rem', padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ width: '2.375rem', height: '2.375rem', borderRadius: '0.625rem', background: `${accent}15`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.0625rem', margin: '0.125rem 0 0', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', margin: '0.25rem 0 0' }}>{sub}</p>}
      </div>
    </div>
  );
}

function uvLabel(uv: number) {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  return 'Very High';
}
function uvColor(uv: number) {
  if (uv <= 2) return '#16a34a';
  if (uv <= 5) return '#ca8a04';
  if (uv <= 7) return '#ea580c';
  return '#dc2626';
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Weather() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState('');

  // Default load: Nagpur on mount
  useEffect(() => {
    loadWeather(21.1458, 79.0882, "Nagpur, Maharashtra");
  }, []);

  async function loadWeather(lat: number, lon: number, name: string) {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${BACKEND_URL}/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      if (!data.success && !data.weather) throw new Error("Weather API failed");

      const weatherData = data.weather || data.data;
      setWeather(mapBackendToUI(weatherData, name));
    } catch {
      setError("Failed to load weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    const geo = await geocodeLocation(query);
    if (!geo) {
      setError('Location not found. Try a different city name.');
      setLoading(false);
      return;
    }

    await loadWeather(geo.lat, geo.lon, geo.name);
  };

  // ── Render (identical to doc 1 UI) ─────────────────────────────────────
  return (
    <div className="page-container" style={{ padding: '5rem 1.5rem 3rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="tag tag-blue" style={{ marginBottom: '0.875rem', display: 'inline-flex' }}>Weather</div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Current Weather Conditions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
          View atmospheric data to supplement your disaster risk assessment.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <MapPin size={15} color="var(--text-subtle)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Enter city or location..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
          {loading ? 'Loading...' : 'Get Weather'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.875rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.625rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Weather card */}
      {weather && (
        <div className="animate-fade-in">

          {/* Hero card */}
          <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)', border: '1px solid rgba(13, 148, 136, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>

              {/* Left: temp + condition */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MapPin size={14} color="#0d9488" />
                  <span style={{ color: '#0d9488', fontWeight: 600, fontSize: '0.9375rem' }}>{weather.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontSize: '4rem', lineHeight: 1 }}>{weather.conditionIcon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.125rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '5rem', lineHeight: 1, letterSpacing: '-0.04em' }}>{weather.temp}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '2rem', marginTop: '0.5rem' }}>°C</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: '0.25rem 0 0', fontWeight: 500 }}>{weather.condition}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>Feels like {weather.feelsLike}°C</p>
                  </div>
                </div>
              </div>

              {/* Right: high/low + UV */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '0.875rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.07)', border: '1px solid rgba(239, 68, 68, 0.18)', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <ArrowUp size={12} color="#dc2626" />
                      <span style={{ color: '#dc2626', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>High</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.5rem' }}>{weather.high}°</span>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'rgba(14, 165, 233, 0.07)', border: '1px solid rgba(14, 165, 233, 0.18)', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.25rem' }}>
                      <ArrowDown size={12} color="#0284c7" />
                      <span style={{ color: '#0284c7', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.5rem' }}>{weather.low}°</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.625rem 1rem', background: `${uvColor(weather.uvIndex)}0d`, border: `1px solid ${uvColor(weather.uvIndex)}25`, borderRadius: '0.625rem' }}>
                  <p style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.125rem' }}>UV Index</p>
                  <span style={{ color: uvColor(weather.uvIndex), fontWeight: 800, fontSize: '1.375rem' }}>{weather.uvIndex}</span>
                  <span style={{ color: uvColor(weather.uvIndex), fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.375rem' }}>{uvLabel(weather.uvIndex)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <MetricCard icon={<Droplets size={16} color="#0284c7" />} label="Humidity"   value={`${weather.humidity}%`}       sub="Relative humidity"   accent="#0284c7" />
            <MetricCard icon={<Wind size={16} color="#475569" />}     label="Wind Speed" value={`${weather.windSpeed} km/h`}   sub="Surface winds"       accent="#475569" />
            <MetricCard icon={<Gauge size={16} color="#ea580c" />}    label="Pressure"   value={`${weather.pressure} hPa`}     sub="Barometric"          accent="#ea580c" />
            <MetricCard icon={<Droplets size={16} color="#2563eb" />} label="Rainfall"   value={`${weather.rainfall} mm`}      sub="Last 24 hours"       accent="#2563eb" />
            <MetricCard icon={<Eye size={16} color="#16a34a" />}      label="Visibility" value={`${weather.visibility} km`}    sub="Horizontal"          accent="#16a34a" />
            <MetricCard icon={<Thermometer size={16} color="#db2777" />} label="Dew Point" value={`${weather.dewPoint}°C`}   sub="Moisture indicator"  accent="#db2777" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!weather && !loading && (
        <div className="glass-card" style={{ borderRadius: '1.25rem', padding: '3.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌤️</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem', margin: '0 0 0.375rem' }}>Check Local Conditions</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Search for any city to view current weather data including temperature, humidity, wind speed, and more.</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
