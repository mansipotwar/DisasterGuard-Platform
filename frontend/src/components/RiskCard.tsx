import { useState, useEffect } from 'react';
import { ChevronRight, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import type { RiskPrediction, DisasterType } from '../types';

interface RiskCardProps {
  type: DisasterType;
  data: RiskPrediction;
  delay?: number;
  onClick?: () => void;
}

const disasterConfig: Record<DisasterType, { label: string; icon: string; accentColor: string; bgColor: string; borderColor: string }> = {
  flood: {
    label: 'Flood',
    icon: '🌊',
    accentColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  wildfire: {
    label: 'Wildfire',
    icon: '🔥',
    accentColor: '#fb923c',
    bgColor: 'rgba(251, 146, 60, 0.05)',
    borderColor: 'rgba(251, 146, 60, 0.15)',
  },
  landslide: {
    label: 'Landslide',
    icon: '⛰️',
    accentColor: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.05)',
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  earthquake: {
    label: 'Earthquake',
    icon: '🌍',
    accentColor: '#facc15',
    bgColor: 'rgba(250, 204, 21, 0.05)',
    borderColor: 'rgba(250, 204, 21, 0.15)',
  },
  hurricane: {
    label: 'Hurricane',
    icon: '🌀',
    accentColor: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.05)',
    borderColor: 'rgba(74, 222, 128, 0.15)',
  },
};

const riskLevelColors = {
  Low: { text: '#4ade80', bg: 'rgba(34, 197, 94, 0.12)', bar: '#22c55e' },
  Medium: { text: '#facc15', bg: 'rgba(234, 179, 8, 0.12)', bar: '#eab308' },
  High: { text: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', bar: '#ef4444' },
};

export default function RiskCard({ type, data, delay = 0, onClick }: RiskCardProps) {
  const [barWidth, setBarWidth] = useState(0);
  const cfg = disasterConfig[type];
  const lvl = riskLevelColors[data.risk_level];

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(data.risk_percent), 300 + delay * 100);
    return () => clearTimeout(timer);
  }, [data.risk_percent, delay]);

  return (
    <div
      className="glass-card card-hover animate-fade-in-up"
      onClick={onClick}
      style={{
        borderRadius: '1rem',
        padding: '1.25rem',
        background: cfg.bgColor,
        border: `1px solid ${cfg.borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        animationDelay: `${delay * 0.1}s`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '100px', height: '100px',
        background: `radial-gradient(circle, ${cfg.accentColor}08 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
            background: `rgba(255,255,255,0.04)`,
            border: `1px solid ${cfg.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.125rem'
          }}>
            {cfg.icon}
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {cfg.label} Risk
            </p>
            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.375rem', margin: '0.125rem 0 0', lineHeight: 1 }}>
              {data.risk_percent}%
            </p>
          </div>
        </div>
        <div style={{
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          background: lvl.bg,
          border: `1px solid ${lvl.text}33`,
          display: 'flex', alignItems: 'center', gap: '0.25rem'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: lvl.text }} />
          <span style={{ color: lvl.text, fontSize: '0.6875rem', fontWeight: 700 }}>{data.risk_level}</span>
        </div>
      </div>

      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${lvl.bar}, ${cfg.accentColor})`,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <TrendingUp size={13} color={cfg.accentColor} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>
            {data.insight}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertTriangle size={13} color="#facc15" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0, lineHeight: 1.5 }}>
            {data.interpretation}
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
          <Shield size={12} color="#0d9488" />
          <span style={{ color: '#0d9488', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Safety Advice
          </span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {data.safety_advice.map((tip, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#0d9488', fontSize: '0.6875rem', fontWeight: 700, marginTop: 2 }}>{i + 1}.</span>
              <span style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.5 }}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {onClick && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: cfg.accentColor, fontSize: '0.75rem', fontWeight: 600 }}>
            View 7-Day Forecast <ChevronRight size={13} />
          </div>
        </div>
      )}
    </div>
  );
}
