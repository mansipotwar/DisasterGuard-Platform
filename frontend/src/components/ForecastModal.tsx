import { X, Droplets, Wind, Thermometer, Cloud } from 'lucide-react';
import type { RiskPrediction, DisasterType } from '../types';

interface Props {
  type: DisasterType;
  data: RiskPrediction;
  locationName: string;
  onClose: () => void;
}

const disasterLabels: Record<DisasterType, string> = {
  flood: 'Flood', wildfire: 'Wildfire', landslide: 'Landslide', earthquake: 'Earthquake', hurricane: 'Hurricane'
};

const conditionIcon = (c: string) => {
  if (c.includes('Rain') || c.includes('Thunder')) return '🌧️';
  if (c.includes('Cloud') || c.includes('Overcast')) return '☁️';
  if (c.includes('Sunny') || c.includes('Clear')) return '☀️';
  return '⛅';
};

export default function ForecastModal({ type, data, locationName, onClose }: Props) {
  const forecast = data.forecast ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div
        className="glass-card animate-fade-in"
        style={{ borderRadius: '1.25rem', maxWidth: '680px', width: '100%', overflow: 'hidden', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(15,23,42,0.8)'
        }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>7-Day Forecast</p>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>
              {disasterLabels[type]} Risk — {locationName.split(',')[0]}
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0.375rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 100px)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {forecast.map((day, i) => (
              <div key={i} style={{
                minWidth: '100px', flexShrink: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '0.75rem',
                padding: '0.875rem 0.75rem',
                textAlign: 'center',
              }}>
                <p style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, margin: '0 0 0.5rem', textTransform: 'uppercase' }}>
                  {day.date.split(',')[0]}
                </p>
                <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>{conditionIcon(day.condition)}</p>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.125rem' }}>
                  {day.temp_max}°
                </p>
                <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0 0 0.625rem' }}>
                  {day.temp_min}°
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Droplets size={10} color="#38bdf8" />
                    <span style={{ color: '#64748b', fontSize: '0.625rem' }}>{day.humidity}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Wind size={10} color="#94a3b8" />
                    <span style={{ color: '#64748b', fontSize: '0.625rem' }}>{day.wind_speed}km/h</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Cloud size={10} color="#64748b" />
                    <span style={{ color: '#64748b', fontSize: '0.625rem' }}>{day.rainfall}mm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.15)', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Thermometer size={16} color="#14b8a6" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ color: '#14b8a6', fontWeight: 600, fontSize: '0.8125rem', margin: '0 0 0.25rem' }}>
                  Current Insight
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
                  {data.insight}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, margin: '0 0 0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Safety Reminders
            </p>
            {data.safety_advice.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.8125rem' }}>{i + 1}.</span>
                <span style={{ color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
