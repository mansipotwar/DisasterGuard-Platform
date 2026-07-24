import { Loader, MapPin, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { predictDisaster } from '../api/client';
import ForecastModal from '../components/ForecastModal';
import RiskCard from '../components/RiskCard';
import { useAuth } from '../contexts/AuthContext';
import { geocodeLocation, mockPredict } from '../lib/mockPredict';

import type { DisasterType, PredictionResult } from '../types';

const disasterKeys: DisasterType[] = [
  'flood',
  'wildfire',
  'landslide',
  'earthquake',
  'hurricane'
];

/* =========================
   DEBUG BOX
========================= */
function DebugBox({ data }: any) {
  const [open, setOpen] = useState(false);

  if (!data?.extra) return null;

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          background: '#f8fafc',
          cursor: 'pointer'
        }}
      >
        {open ? 'Hide AI Details' : 'Show AI Details'}
      </button>

      {open && (
        <div style={{
          marginTop: '8px',
          padding: '10px',
          borderRadius: '8px',
          background: '#0f172a',
          color: '#e2e8f0',
          fontSize: '11px'
        }}>
          <p>Confidence Bucket: {data.extra.confidence_bucket}</p>
          <p>Fusion: {data.extra.fusion_type}</p>
          <p>ML Score: {data.extra.ml_score}</p>
          <p>Rule Score: {data.extra.rule_score}</p>

          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(data.extra, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Prediction() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<DisasterType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const name = searchParams.get('name');

    if (lat && lon) {
      runAnalysis(parseFloat(lat), parseFloat(lon), name || `${lat}, ${lon}`);
    }
  }, []);

  /* =========================
     API + MOCK MERGE
  ========================= */
  const runAnalysis = async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const realRes = await predictDisaster({ lat, lon });
      const mockRes = await mockPredict(lat, lon, name);

      const merged: any = {};

      Object.keys(realRes.data.predictions).forEach((key) => {
        const p = realRes.data.predictions[key];

        merged[key] = {
          risk_level: p.risk_level,
          probability: p.probability,
          probability_percent: p.probability_percent,
          confidence_percent: p.confidence_percent,

          insight: p.insight,
          interpretation: p.interpretation,
          reasoning: p.reasoning,
          safety_advice: p.safety_advice,

          risk_score: p.risk_score,
          risk_score_percent: p.risk_score_percent,
          factors_used: p.factors_used,

          extra: p.extra,

          forecast: mockRes.predictions[key]?.forecast || []
        };
      });

      setResult({
        location: {
          full_name: realRes.data.location || name,
          lat,
          lon
        },
        date: realRes.data.timestamp,
        predictions: merged
      });

    } catch (err) {
      console.error(err);
      setError('Failed to analyze location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SEARCH
  ========================= */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const match = query.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);

    if (match) {
      runAnalysis(parseFloat(match[1]), parseFloat(match[2]), query);
      return;
    }

    setLoading(true);
    setError('');

    const geo = await geocodeLocation(query);

    if (!geo) {
      setError('Location not found');
      setLoading(false);
      return;
    }

    runAnalysis(geo.lat, geo.lon, geo.name);
  };

  /* =========================
     SAVE
  ========================= */
  const handleSave = async () => {
  // Saving feature temporarily disabled
  alert("Save Predictions feature is coming soon!");
};

  return (
    <div style={{ padding: '5rem 2rem', maxWidth: '1300px', margin: 'auto' }}>

      {/* HEADER */}
      <h1>🌍 Disaster Risk Prediction</h1>
      <p>AI + Real-time Weather + Explainable ML + 7-day Forecast</p>

      {/* 🔍 CLEAN FLOATING SEARCH BAR (NO OUTER BORDER) */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '2rem',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '0'
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px'
          }}
        >
          <MapPin
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }}
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter city or lat,lon (e.g. 21.1, 79.1)"
            style={{
              width: '100%',
              padding: '10px 10px 10px 34px',
              borderRadius: '6px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? <Loader size={14} /> : <Search size={14} />}
          {loading ? 'Analyzing' : 'Analyse'}
        </button>
      </form>

      {/* ERROR */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* RESULT */}
      {result && !loading && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <MapPin size={16} /> {result.location.full_name}
          </div>

         <button onClick={handleSave}>
  <Save />
  Save (Coming Soon)
</button>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.2rem'
          }}>
            {disasterKeys.map((key) => (
              <div key={key}>
                <RiskCard
                  type={key}
                  data={result.predictions[key]}
                  onClick={() => setSelectedCard(key)}
                />

                <DebugBox data={result.predictions[key]} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL */}
      {selectedCard && result && (
        <ForecastModal
          type={selectedCard}
          data={result.predictions[selectedCard]}
          locationName={result.location.full_name}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}