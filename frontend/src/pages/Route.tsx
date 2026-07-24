import { AlertTriangle, ArrowRight, MapPin, Navigation, Shield } from 'lucide-react';
import { useState } from 'react';
import MapView from '../components/MapView';
import { useLiveLocation } from '../hooks/useLiveLocation';

/* ─────────────────────────────────────────────
   DEFAULT SAFETY TIPS shown before any route is
   calculated (so the panel is never empty).
───────────────────────────────────────────── */
const DEFAULT_SAFETY_TIPS = [
  'Always wear your seatbelt and ensure all passengers are buckled before starting your journey.',
  'Avoid using your phone while driving — even hands-free calls can distract you.',
  'Keep a safe following distance of at least 3 seconds behind the vehicle ahead.',
  'Check your mirrors every 5–8 seconds to stay aware of surrounding traffic.',
  'If you feel drowsy, pull over safely and rest — do not push through fatigue.',
  'Keep an emergency kit in your vehicle: first-aid supplies, torch, water and a charged power bank.',
  'Obey speed limits especially in school zones, hospital zones and residential areas.',
  'Signal your intentions early — indicate at least 30 metres before turning or changing lanes.',
  'Never drive under the influence of alcohol, medication that causes drowsiness, or drugs.',
  'In poor visibility (fog, rain, night) switch on headlights and reduce speed accordingly.',
];

/* ─────────────────────────────────────────────
   PROPS
   dark  – boolean controlled by your existing header toggle
           e.g. <Route dark={isDark} />
───────────────────────────────────────────── */
interface RouteProps {
  dark?: boolean;
}

export default function Route({ dark = false }: RouteProps) {
  const [source, setSource]           = useState('');
  const [destination, setDestination] = useState('');
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const userLocation = useLiveLocation();

  /* ── geocode (unchanged) ── */
  const geocode = async (place: string) => {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`);
    const json = await res.json();
    if (!json.length) return null;
    return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
  };

  /* ── handleFind (unchanged) ── */
  const handleFind = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const src = await geocode(source);
      const dst = await geocode(destination);

      if (!src || !dst) { setError('Invalid location'); setLoading(false); return; }

      const res  = await fetch('https://disasterguard-backend-jtg7.onrender.com/route/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_lat: src.lat, source_lon: src.lon, dest_lat: dst.lat, dest_lon: dst.lon }),
      });
      const json = await res.json();

      if (!res.ok) setError(json.error);
      else setData({ ...json, source: src, destination: dst, hospitals: json.nearest_hospitals });
    } catch {
      setError('Server error');
    }

    setLoading(false);
  };

  /* ── helpers (unchanged) ── */
  const getRiskColor = (score: number) => score <= 3 ? '#22c55e' : score <= 6 ? '#f59e0b' : '#ef4444';
  const getRiskLabel = (score: number) => score <= 3 ? 'LOW'     : score <= 6 ? 'MODERATE' : 'HIGH';

  const displayedTips: string[]  = data?.safety_tips?.length ? data.safety_tips : DEFAULT_SAFETY_TIPS;
  const nearestHospitalName      = data?.hospitals?.[0]?.name ?? 'None found';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── THEME TOKENS (driven by dark prop) ── */
        .sns-root {
          --bg:           ${dark ? '#0f172a' : '#f1f5f9'};
          --surface:      ${dark ? '#1e293b' : '#ffffff'};
          --surface2:     ${dark ? '#273549' : '#fafafa'};
          --border:       ${dark ? '#334155' : '#e2e8f0'};
          --border2:      ${dark ? '#1e293b' : '#f1f5f9'};
          --text:         ${dark ? '#e2e8f0' : '#1e293b'};
          --text2:        ${dark ? '#94a3b8' : '#475569'};
          --muted:        ${dark ? '#64748b' : '#94a3b8'};
          --input-bg:     ${dark ? '#1e293b' : '#f8fafc'};
          --step-bg:      ${dark ? '#1e293b' : '#f8fafc'};
          --step-border:  ${dark ? '#334155' : '#f1f5f9'};
          --scroll-thumb: ${dark ? '#475569' : '#cbd5e1'};
          --shadow-sm:    ${dark ? '0 1px 6px rgba(0,0,0,0.4)'  : '0 1px 6px rgba(0,0,0,0.06)'};
          --shadow-md:    ${dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'};
          --shadow-card:  ${dark ? '0 2px 10px rgba(0,0,0,0.35)': '0 2px 10px rgba(0,0,0,0.04)'};
        }

        .sns-root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          padding-top: 80px;
          transition: background 0.25s, color 0.25s;
        }

        /* ── SEARCH BAR ── */
        .sns-search-wrap {
          padding: 18px 36px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          transition: background 0.25s;
        }
        .sns-form { display: flex; align-items: center; gap: 12px; max-width: 820px; }
        .sns-input-group { flex: 1; position: relative; }
        .sns-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--muted); pointer-events: none;
        }
        .sns-input {
          width: 100%;
          background: var(--input-bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          padding: 12px 16px 12px 42px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.25s;
        }
        .sns-input::placeholder { color: var(--muted); }
        .sns-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          background: var(--surface);
        }
        .sns-arrow { color: var(--muted); flex-shrink: 0; }
        .sns-btn {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none; border-radius: 12px; color: #fff;
          cursor: pointer; font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
          padding: 12px 28px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(59,130,246,0.28);
        }
        .sns-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(59,130,246,0.38); }
        .sns-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .sns-error {
          margin-top: 10px; display: flex; align-items: center; gap: 8px;
          color: #ef4444; font-family: 'DM Mono', monospace; font-size: 13px;
        }

        /* ── LOADING ── */
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .sns-loading { display: flex; gap: 6px; align-items: center; padding: 40px 36px; }
        .sns-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; animation: pulse 1.2s ease-in-out infinite; }
        .sns-dot:nth-child(2) { animation-delay: 0.2s; }
        .sns-dot:nth-child(3) { animation-delay: 0.4s; }
        .sns-loading-text { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); margin-left: 8px; letter-spacing: 1px; }

        /* ── BODY ── */
        .sns-body { padding: 28px 36px; }

        /* ── MAP ── */
        .sns-map-container {
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--border);
          margin-bottom: 24px;
          box-shadow: var(--shadow-md);
          min-height: 420px;
        }

        /* ── RISK BANNER ── */
        .sns-risk-banner {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px 28px; margin-bottom: 24px; gap: 20px;
          box-shadow: var(--shadow-card); transition: background 0.25s;
        }
        .sns-risk-left { display: flex; align-items: center; gap: 16px; }
        .sns-risk-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sns-risk-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
        .sns-risk-value { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
        .sns-risk-badge {
          font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
          letter-spacing: 2px; padding: 4px 10px; border-radius: 6px; border: 1px solid;
          margin-left: 10px; vertical-align: middle;
        }
        .sns-hospital-nearest { text-align: right; }
        .sns-hospital-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
        .sns-hospital-name { font-size: 15px; font-weight: 700; color: #3b82f6; }

        /* ── GRID ── */
        .sns-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* ── PANEL ── */
        .sns-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden;
          box-shadow: var(--shadow-card); transition: background 0.25s;
        }
        .sns-panel-header {
          display: flex; align-items: center; gap: 10px;
          padding: 15px 22px; border-bottom: 1px solid var(--border2);
          font-size: 13px; font-weight: 700; letter-spacing: 0.3px;
          color: var(--text); background: var(--surface2);
          transition: background 0.25s;
        }
        .sns-panel-header-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sns-panel-body { padding: 16px 22px; }

        /* ── TABS ── */
        .sns-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
        .sns-tab {
          flex: 1; background: var(--input-bg); border: 1.5px solid var(--border);
          border-radius: 10px; color: var(--muted);
          cursor: pointer; font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 600; padding: 9px 12px;
          text-align: center; transition: all 0.2s; letter-spacing: 0.3px;
        }
        .sns-tab.active-normal { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
        .sns-tab.active-safe   { background: #f0fdf4; border-color: #86efac; color: #16a34a; }

        /* ── STEPS ── */
        .sns-steps { display: flex; flex-direction: column; gap: 6px; }
        .sns-step {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; background: var(--step-bg);
          border-radius: 10px; border: 1px solid var(--step-border);
          transition: background 0.25s;
        }
        .sns-step-num {
          font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
          color: var(--text2); background: var(--border);
          border-radius: 5px; padding: 2px 7px; flex-shrink: 0; margin-top: 1px;
        }
        .sns-step-text { font-size: 13px; color: var(--text2); line-height: 1.45; }
        .sns-step-meta { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 3px; }
        .sns-step.safe { border-color: #bbf7d0; background: ${dark ? '#0f2e1a' : '#f0fdf4'}; }
        .sns-step.safe .sns-step-num { background: #dcfce7; color: #16a34a; }

        /* ── TIPS ── */
        .sns-tip {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border2);
          font-size: 13px; color: var(--text2); line-height: 1.5;
        }
        .sns-tip:last-child { border-bottom: none; }
        .sns-tip-bullet { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; margin-top: 6px; flex-shrink: 0; }

        /* ── HOSPITALS ── */
        .sns-hospital-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid var(--border2);
        }
        .sns-hospital-item:last-child { border-bottom: none; }
        .sns-hospital-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: ${dark ? '#1e3a5f' : '#eff6ff'};
          border: 1px solid ${dark ? '#1d4ed8' : '#bfdbfe'};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .sns-hospital-info-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .sns-hospital-coords { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 2px; }
        .sns-hospital-rest {
          margin-top: 5px;
          display: inline-flex; align-items: center; gap: 5px;
          background: ${dark ? '#064e3b' : '#ecfdf5'};
          border: 1px solid ${dark ? '#065f46' : '#a7f3d0'};
          border-radius: 5px; padding: 3px 9px;
          font-family: 'DM Mono', monospace; font-size: 10px;
          color: #10b981; font-weight: 500; letter-spacing: 0.5px;
        }

        /* ── SCROLL ── */
        .sns-scroll { max-height: 320px; overflow-y: auto; }
        .sns-scroll::-webkit-scrollbar { width: 4px; }
        .sns-scroll::-webkit-scrollbar-track { background: transparent; }
        .sns-scroll::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 2px; }

        /* ── EMPTY STATE ── */
        .sns-empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 48px 24px; gap: 12px; text-align: center;
        }
        .sns-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: ${dark ? '#1e3a5f' : '#eff6ff'};
          border: 1px solid ${dark ? '#1d4ed8' : '#bfdbfe'};
          display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .sns-empty-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .sns-empty-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); max-width: 200px; line-height: 1.6; }

        @media (max-width: 700px) {
          .sns-grid { grid-template-columns: 1fr; }
          .sns-form { flex-wrap: wrap; }
          .sns-risk-banner { flex-direction: column; align-items: flex-start; }
          .sns-hospital-nearest { text-align: left; }
          .sns-search-wrap, .sns-body { padding-left: 18px; padding-right: 18px; }
        }
      `}</style>

      <div className="sns-root">

        {/* ── SEARCH ── */}
        <div className="sns-search-wrap">
          <form onSubmit={handleFind} className="sns-form">
            <div className="sns-input-group">
              <MapPin size={15} className="sns-input-icon" />
              <input className="sns-input" value={source} onChange={e => setSource(e.target.value)} placeholder="Origin" />
            </div>

            <ArrowRight size={18} className="sns-arrow" />

            <div className="sns-input-group">
              <Navigation size={15} className="sns-input-icon" />
              <input className="sns-input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination" />
            </div>

            <button className="sns-btn" disabled={loading}>
              {loading ? 'Calculating…' : 'Find Route'}
            </button>
          </form>

          {error && (
            <div className="sns-error">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="sns-loading">
            <div className="sns-dot" /><div className="sns-dot" /><div className="sns-dot" />
            <span className="sns-loading-text">CALCULATING SAFE ROUTE</span>
          </div>
        )}

        {/* ── RESULTS ── */}
        {data ? (
          <div className="sns-body">

            {/* MAP */}
            <div className="sns-map-container">
              <MapView
                normalRoute={data.normal_route}
                safeRoute={data.safe_route}
                src={data.source}
                dst={data.destination}
                hospitals={data.hospitals}
              />
            </div>

            {/* RISK BANNER */}
            <div className="sns-risk-banner">
              <div className="sns-risk-left">
                <div
                  className="sns-risk-icon"
                  style={{
                    background: `rgba(${data.risk_score <= 3 ? '34,197,94' : data.risk_score <= 6 ? '245,158,11' : '239,68,68'},0.12)`,
                    border:     `1px solid rgba(${data.risk_score <= 3 ? '34,197,94' : data.risk_score <= 6 ? '245,158,11' : '239,68,68'},0.3)`,
                  }}
                >
                  <Shield size={22} color={getRiskColor(data.risk_score)} />
                </div>
                <div>
                  <div className="sns-risk-label">Risk Score</div>
                  <div className="sns-risk-value" style={{ color: getRiskColor(data.risk_score) }}>
                    {data.risk_score}
                    <span
                      className="sns-risk-badge"
                      style={{
                        color:       getRiskColor(data.risk_score),
                        borderColor: `rgba(${data.risk_score <= 3 ? '34,197,94' : data.risk_score <= 6 ? '245,158,11' : '239,68,68'},0.35)`,
                        background:  `rgba(${data.risk_score <= 3 ? '34,197,94' : data.risk_score <= 6 ? '245,158,11' : '239,68,68'},0.08)`,
                      }}
                    >
                      {getRiskLabel(data.risk_score)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sns-hospital-nearest">
                <div className="sns-hospital-label">Nearest Hospital</div>
                <div className="sns-hospital-name">{nearestHospitalName}</div>
              </div>
            </div>

            {/* GRID */}
            <div className="sns-grid">

              <div className="sns-panel">
                <div className="sns-panel-header">
                  <div className="sns-panel-header-dot" style={{ background: '#60a5fa' }} />
                  Navigation
                </div>
                <div className="sns-panel-body">
                  <RouteTabPanel normalSteps={data.normal_route.steps} safeSteps={data.safe_route.steps} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div className="sns-panel">
                  <div className="sns-panel-header">
                    <div className="sns-panel-header-dot" style={{ background: '#fbbf24' }} />
                    Safety Tips
                  </div>
                  <div className="sns-panel-body sns-scroll">
                    {displayedTips.map((t, i) => (
                      <div key={i} className="sns-tip">
                        <div className="sns-tip-bullet" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sns-panel">
                  <div className="sns-panel-header">
                    <div className="sns-panel-header-dot" style={{ background: '#38bdf8' }} />
                    Nearby Hospitals
                  </div>
                  <div className="sns-panel-body sns-scroll">
                    {data.hospitals?.map((h: any, i: number) => (
                      <div key={i} className="sns-hospital-item">
                        <div className="sns-hospital-icon"><span style={{ fontSize: 15 }}>🏥</span></div>
                        <div>
                          <div className="sns-hospital-info-name">{h.name}</div>
                          <div className="sns-hospital-coords">{h.lat.toFixed(4)}, {h.lon.toFixed(4)}</div>
                          <div className="sns-hospital-rest">
                            ✦ Hospital detected in route city — you may stop here to rest
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

        ) : !loading && (
          <div className="sns-body">
            <div className="sns-grid">

              <div className="sns-panel">
                <div className="sns-panel-header">
                  <div className="sns-panel-header-dot" style={{ background: '#60a5fa' }} />
                  Navigation
                </div>
                <div className="sns-panel-body">
                  <div className="sns-empty-state">
                    <div className="sns-empty-icon">🗺️</div>
                    <div className="sns-empty-title">No route yet</div>
                    <div className="sns-empty-sub">Enter an origin and destination above to calculate your route</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div className="sns-panel">
                  <div className="sns-panel-header">
                    <div className="sns-panel-header-dot" style={{ background: '#fbbf24' }} />
                    Safety Tips
                  </div>
                  <div className="sns-panel-body sns-scroll">
                    {DEFAULT_SAFETY_TIPS.map((t, i) => (
                      <div key={i} className="sns-tip">
                        <div className="sns-tip-bullet" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sns-panel">
                  <div className="sns-panel-header">
                    <div className="sns-panel-header-dot" style={{ background: '#38bdf8' }} />
                    Nearby Hospitals
                  </div>
                  <div className="sns-panel-body">
                    <div className="sns-empty-state">
                      <div className="sns-empty-icon">🏥</div>
                      <div className="sns-empty-title">Hospitals will appear here</div>
                      <div className="sns-empty-sub">Hospitals near your route are shown once a route is calculated</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── ROUTE TAB PANEL (pure UI helper — unchanged logic) ── */
function RouteTabPanel({ normalSteps, safeSteps }: { normalSteps: any[]; safeSteps: any[] }) {
  const [activeTab, setActiveTab] = useState<'normal' | 'safe'>('normal');

  return (
    <>
      <div className="sns-tabs">
        <button className={`sns-tab ${activeTab === 'normal' ? 'active-normal' : ''}`} onClick={() => setActiveTab('normal')}>
          🚗 Normal Route
        </button>
        <button className={`sns-tab ${activeTab === 'safe' ? 'active-safe' : ''}`} onClick={() => setActiveTab('safe')}>
          🛡 Safe Route
        </button>
      </div>

      <div className="sns-steps sns-scroll">
        {activeTab === 'normal'
          ? normalSteps?.map((s: any, i: number) => (
              <div key={i} className="sns-step">
                <span className="sns-step-num">{i + 1}</span>
                <div>
                  <div className="sns-step-text">{s.instruction}</div>
                  <div className="sns-step-meta">{s.distance} m · {s.duration} sec</div>
                </div>
              </div>
            ))
          : safeSteps?.map((s: any, i: number) => (
              <div key={i} className="sns-step safe">
                <span className="sns-step-num">{i + 1}</span>
                <div className="sns-step-text">{s.instruction}</div>
              </div>
            ))
        }
      </div>
    </>
  );
}
