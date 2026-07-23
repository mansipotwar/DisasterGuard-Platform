import { Activity, BarChart2, Flame, Mountain, Waves, Wind } from 'lucide-react';
import { useState } from 'react';

const disasterData = {
  flood: {
    label: 'Flood',
    icon: Waves,
    color: '#0284c7',
    secondColor: '#38bdf8',
    bgImage: 'https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description: 'Flood risk assessment analyzes river basin hydrology, precipitation patterns, and terrain to predict inundation probability.',
    stats: [{ label: 'Avg Events/Year', value: '1,287' }, { label: 'Affected Regions', value: '142' }, { label: 'Model Accuracy', value: '91.4%' }],
    monthlyData: [
      { month: 'Jan', risk: 32, events: 8 }, { month: 'Feb', risk: 28, events: 6 }, { month: 'Mar', risk: 38, events: 10 },
      { month: 'Apr', risk: 55, events: 16 }, { month: 'May', risk: 72, events: 24 }, { month: 'Jun', risk: 88, events: 34 },
      { month: 'Jul', risk: 92, events: 40 }, { month: 'Aug', risk: 85, events: 36 }, { month: 'Sep', risk: 68, events: 22 },
      { month: 'Oct', risk: 44, events: 12 }, { month: 'Nov', risk: 36, events: 9 }, { month: 'Dec', risk: 30, events: 7 },
    ],
    features: [
      { name: 'Precipitation (48h)', weight: 35 }, { name: 'Soil Saturation', weight: 25 },
      { name: 'River Proximity', weight: 20 }, { name: 'Elevation', weight: 12 }, { name: 'Urbanization', weight: 8 },
    ],
  },
  wildfire: {
    label: 'Wildfire',
    icon: Flame,
    color: '#ea580c',
    secondColor: '#fb923c',
    bgImage: 'https://images.pexels.com/photos/51951/forest-fire-fire-smoke-conservation-51951.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description: 'Wildfire risk is computed using vegetation moisture indices, temperature anomalies, wind patterns, and historical ignition data.',
    stats: [{ label: 'Avg Events/Year', value: '847' }, { label: 'Affected Regions', value: '89' }, { label: 'Model Accuracy', value: '88.7%' }],
    monthlyData: [
      { month: 'Jan', risk: 20, events: 4 }, { month: 'Feb', risk: 25, events: 5 }, { month: 'Mar', risk: 35, events: 9 },
      { month: 'Apr', risk: 48, events: 13 }, { month: 'May', risk: 62, events: 20 }, { month: 'Jun', risk: 80, events: 30 },
      { month: 'Jul', risk: 95, events: 42 }, { month: 'Aug', risk: 90, events: 38 }, { month: 'Sep', risk: 70, events: 25 },
      { month: 'Oct', risk: 45, events: 11 }, { month: 'Nov', risk: 28, events: 6 }, { month: 'Dec', risk: 18, events: 3 },
    ],
    features: [
      { name: 'Temperature Anomaly', weight: 30 }, { name: 'Drought Index', weight: 28 },
      { name: 'Vegetation Dryness', weight: 22 }, { name: 'Wind Speed', weight: 12 }, { name: 'Fire History', weight: 8 },
    ],
  },
  landslide: {
    label: 'Landslide',
    icon: Mountain,
    color: '#0d9488',
    secondColor: '#14b8a6',
    bgImage: 'https://images.pexels.com/photos/2335126/pexels-photo-2335126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description: 'Landslide susceptibility is evaluated from slope gradient, lithology, soil saturation, cumulative rainfall, and land cover data.',
    stats: [{ label: 'Avg Events/Year', value: '534' }, { label: 'Affected Regions', value: '67' }, { label: 'Model Accuracy', value: '86.2%' }],
    monthlyData: [
      { month: 'Jan', risk: 18, events: 3 }, { month: 'Feb', risk: 22, events: 4 }, { month: 'Mar', risk: 40, events: 11 },
      { month: 'Apr', risk: 60, events: 18 }, { month: 'May', risk: 75, events: 28 }, { month: 'Jun', risk: 85, events: 34 },
      { month: 'Jul', risk: 88, events: 36 }, { month: 'Aug', risk: 80, events: 30 }, { month: 'Sep', risk: 60, events: 18 },
      { month: 'Oct', risk: 38, events: 9 }, { month: 'Nov', risk: 25, events: 5 }, { month: 'Dec', risk: 16, events: 2 },
    ],
    features: [
      { name: 'Cumulative Rainfall', weight: 32 }, { name: 'Slope Gradient', weight: 28 },
      { name: 'Soil Type', weight: 20 }, { name: 'Land Cover', weight: 12 }, { name: 'Seismic Activity', weight: 8 },
    ],
  },
  earthquake: {
    label: 'Earthquake',
    icon: Activity,
    color: '#ca8a04',
    secondColor: '#facc15',
    bgImage: 'https://images.pexels.com/photos/4127599/pexels-photo-4127599.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description: 'Seismic risk modeling leverages fault line proximity, historical seismicity catalogs, soil amplification factors, and tectonic plate stress maps.',
    stats: [{ label: 'Avg Events/Year', value: '2,140' }, { label: 'Affected Regions', value: '198' }, { label: 'Model Accuracy', value: '79.3%' }],
    monthlyData: [
      { month: 'Jan', risk: 45, events: 14 }, { month: 'Feb', risk: 42, events: 13 }, { month: 'Mar', risk: 50, events: 16 },
      { month: 'Apr', risk: 55, events: 18 }, { month: 'May', risk: 48, events: 15 }, { month: 'Jun', risk: 52, events: 17 },
      { month: 'Jul', risk: 60, events: 20 }, { month: 'Aug', risk: 58, events: 19 }, { month: 'Sep', risk: 54, events: 17 },
      { month: 'Oct', risk: 49, events: 15 }, { month: 'Nov', risk: 46, events: 14 }, { month: 'Dec', risk: 43, events: 13 },
    ],
    features: [
      { name: 'Fault Distance', weight: 40 }, { name: 'Historical Magnitude', weight: 30 },
      { name: 'Soil Amplification', weight: 15 }, { name: 'Depth', weight: 10 }, { name: 'Plate Stress', weight: 5 },
    ],
  },
  hurricane: {
    label: 'Hurricane',
    icon: Wind,
    color: '#0369a1',
    secondColor: '#38bdf8',
    bgImage: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=1200',
    description: 'Hurricane probability models integrate sea surface temperatures, atmospheric pressure gradients, wind shear, and historical storm track data.',
    stats: [{ label: 'Avg Events/Year', value: '312' }, { label: 'Affected Regions', value: '54' }, { label: 'Model Accuracy', value: '93.1%' }],
    monthlyData: [
      { month: 'Jan', risk: 5, events: 1 }, { month: 'Feb', risk: 5, events: 1 }, { month: 'Mar', risk: 8, events: 1 },
      { month: 'Apr', risk: 15, events: 3 }, { month: 'May', risk: 30, events: 7 }, { month: 'Jun', risk: 55, events: 16 },
      { month: 'Jul', risk: 72, events: 24 }, { month: 'Aug', risk: 88, events: 36 }, { month: 'Sep', risk: 92, events: 40 },
      { month: 'Oct', risk: 65, events: 20 }, { month: 'Nov', risk: 30, events: 6 }, { month: 'Dec', risk: 12, events: 2 },
    ],
    features: [
      { name: 'Sea Surface Temp', weight: 35 }, { name: 'Atmospheric Pressure', weight: 25 },
      { name: 'Wind Shear', weight: 20 }, { name: 'Ocean Depth', weight: 12 }, { name: 'Humidity', weight: 8 },
    ],
  },
};

type DisasterKey = keyof typeof disasterData;

const W = 340, H = 180, PAD = { top: 12, right: 8, bottom: 28, left: 30 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

interface MonthPoint { month: string; risk: number; events: number; }

function AreaChart({ data, color, dataKey }: { data: MonthPoint[]; color: string; dataKey: 'risk' | 'events' }) {
  const vals = data.map(d => d[dataKey]);
  const maxV = Math.max(...vals) || 1;
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * CW,
    y: PAD.top + CH - (d[dataKey] / maxV) * CH,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + CH} L ${pts[0].x} ${PAD.top + CH} Z`;
  const ticks = [0, Math.round(maxV / 2), maxV];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`ag-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map(t => {
        const y = PAD.top + CH - (t / maxV) * CH;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-subtle)">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = PAD.left + (i / (data.length - 1)) * CW;
        return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="var(--text-subtle)">{d.month}</text>;
      })}
      <path d={areaPath} fill={`url(#ag-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

function BarChart({ data, color, dataKey }: { data: MonthPoint[]; color: string; dataKey: 'risk' | 'events' }) {
  const vals = data.map(d => d[dataKey]);
  const maxV = Math.max(...vals) || 1;
  const bw = (CW / data.length) * 0.6;
  const gap = CW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {[0, Math.round(maxV / 2), maxV].map(t => {
        const y = PAD.top + CH - (t / maxV) * CH;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-subtle)">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = PAD.left + i * gap + gap / 2 - bw / 2;
        const bh = (d[dataKey] / maxV) * CH;
        const y = PAD.top + CH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="2" fill={color} opacity="0.82" />
            <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="var(--text-subtle)">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, color, secondColor }: { data: MonthPoint[]; color: string; secondColor: string }) {
  const maxRisk = Math.max(...data.map(d => d.risk)) || 1;
  const maxEvents = Math.max(...data.map(d => d.events)) || 1;

  const riskPts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * CW,
    y: PAD.top + CH - (d.risk / maxRisk) * CH,
  }));
  const eventPts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * CW,
    y: PAD.top + CH - (d.events / maxEvents) * CH,
  }));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {[0, 50, 100].map(t => {
        const y = PAD.top + CH - (t / 100) * CH;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + CW} y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-subtle)">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={i} x={PAD.left + (i / (data.length - 1)) * CW} y={H - 4} textAnchor="middle" fontSize="8" fill="var(--text-subtle)">{d.month}</text>
      ))}
      <path d={toPath(riskPts)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d={toPath(eventPts)} fill="none" stroke={secondColor} strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 3" />
      <g>
        <rect x={PAD.left} y={H - 28} width="8" height="3" fill={color} rx="1" />
        <text x={PAD.left + 11} y={H - 24} fontSize="8" fill="var(--text-muted)">Risk %</text>
        <rect x={PAD.left + 50} y={H - 28} width="8" height="3" fill={secondColor} rx="1" />
        <text x={PAD.left + 63} y={H - 24} fontSize="8" fill="var(--text-muted)">Events</text>
      </g>
    </svg>
  );
}

export default function Analysis() {
  const [active, setActive] = useState<DisasterKey>('flood');
  const d = disasterData[active];
  const Icon = d.icon;

  return (
    <div className="page-container" style={{ padding: '5rem 0 3rem', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <div className="tag tag-blue" style={{ marginBottom: '0.875rem', display: 'inline-flex' }}>
          <BarChart2 size={10} /> Risk Analysis
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Disaster Risk Analysis
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0 }}>
          Statistical breakdown of each disaster type with monthly risk trends and key predictive features.
        </p>
      </div>

      <div style={{ padding: '0 1.5rem', display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {(Object.keys(disasterData) as DisasterKey[]).map(key => {
          const cfg = disasterData[key];
          const TabIcon = cfg.icon;
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '0.625rem',
                border: `1px solid ${isActive ? cfg.color : 'var(--border-color)'}`,
                background: isActive ? `${cfg.color}12` : 'var(--bg-card)',
                color: isActive ? cfg.color : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <TabIcon size={14} color={isActive ? cfg.color : 'var(--text-subtle)'} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', height: '220px', marginBottom: '1.75rem', overflow: 'hidden' }}>
        <img src={d.bgImage} alt={d.label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${d.color}40, transparent 60%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)`,
          display: 'flex', alignItems: 'flex-end', padding: '1.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '0.875rem', background: `${d.color}30`, border: `1px solid ${d.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
              <Icon size={22} color={d.secondColor} />
            </div>
            <div>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>{d.label} Risk Analysis</h2>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.875rem', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>{d.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {d.stats.map(s => (
            <div key={s.label} className="glass-card" style={{ borderRadius: '0.875rem', padding: '1rem 1.25rem', borderLeft: `3px solid ${d.color}` }}>
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>{s.label}</p>
              <p style={{ color: d.color, fontWeight: 800, fontSize: '1.5rem', margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>Monthly Risk Index (%)</p>
            <AreaChart data={d.monthlyData} color={d.color} dataKey="risk" />
          </div>

          <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>Monthly Event Count</p>
            <BarChart data={d.monthlyData} color={d.color} dataKey="events" />
          </div>

          <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>Risk vs. Events Trend</p>
            <LineChart data={d.monthlyData} color={d.color} secondColor={d.secondColor} />
          </div>

          <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 1rem' }}>Feature Importance</p>
            {d.features.map(f => (
              <div key={f.name} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{f.name}</span>
                  <span style={{ color: d.color, fontSize: '0.8125rem', fontWeight: 700 }}>{f.weight}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.weight * 2}%`, background: `linear-gradient(90deg, ${d.color}, ${d.secondColor})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
