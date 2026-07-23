import { useNavigate } from 'react-router-dom';
import { Shield, Zap, MapPin, BarChart3, AlertTriangle, Wind, ArrowRight, ChevronRight, Waves, Flame, Mountain, Activity } from 'lucide-react';

const features = [
  { icon: Waves, label: 'Flood Detection', desc: 'Real-time analysis of precipitation, soil saturation, and drainage capacity to flag elevated flood risk.', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' },
  { icon: Flame, label: 'Wildfire Risk', desc: 'Dry condition monitoring combined with vegetation density and wind patterns to assess fire susceptibility.', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.08)' },
  { icon: Mountain, label: 'Landslide Analysis', desc: 'Terrain slope and rainfall correlation to identify unstable zones before ground movement occurs.', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.08)' },
  { icon: Activity, label: 'Earthquake Baseline', desc: 'Seismic zone mapping and fault proximity analysis to communicate baseline ground movement risk.', color: '#facc15', bg: 'rgba(250, 204, 21, 0.08)' },
  { icon: Wind, label: 'Hurricane Awareness', desc: 'Sea surface temperature and atmospheric pressure monitoring to track tropical cyclone potential.', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.08)' },
];

const steps = [
  { n: '01', title: 'Input Location', desc: 'Enter a city, address, or drop lat/lon coordinates into the search bar.', icon: MapPin },
  { n: '02', title: 'Fetch Weather Data', desc: 'We pull real-time atmospheric and environmental data for your location.', icon: BarChart3 },
  { n: '03', title: 'Analyze Risks', desc: 'Our engine evaluates five disaster categories simultaneously.', icon: Shield },
  { n: '04', title: 'View Safety Insights', desc: 'Receive risk percentages, interpretations, and actionable safety guidance.', icon: Zap },
];

const testimonials = [
  { name: 'Riya Sharma', role: 'Emergency Coordinator, Mumbai', text: 'DisAlert helped our team prepare a week in advance of heavy flooding. The risk cards with safety guidance were immediately actionable.', rating: 5 },
  { name: 'Carlos Mendez', role: 'Civil Defense Volunteer, Mexico City', text: 'The earthquake baseline analysis gave us confidence to run preparedness drills at the right time. Highly accurate and easy to read.', rating: 5 },
  { name: 'Amara Osei', role: 'Community Resilience Officer', text: "I share the wildfire risk cards with our rural communities every week. The plain-English insights make it accessible to everyone.", rating: 5 },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh' }}>
      <section className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[80, 160, 240].map((size, i) => (
            <div key={i} className="ping-ring" style={{
              width: size, height: size,
              animationDelay: `${i * 1}s`,
              opacity: 0.4,
              top: '45%', left: '75%',
            }} />
          ))}
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem', width: '100%' }}>
          <div style={{ maxWidth: '720px' }}>
            <div className="tag tag-teal animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              <Shield size={10} />
              Early Disaster Intelligence Platform
            </div>

            <h1 className="animate-fade-in-up delay-100" style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              margin: '0 0 1.25rem',
              color: '#f1f5f9',
            }}>
              Detect Disaster Risk{' '}
              <span className="gradient-text">Before It Strikes</span>
            </h1>

            <p className="animate-fade-in-up delay-200" style={{
              color: '#64748b', fontSize: '1.0625rem', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: '580px'
            }}>
              Real-time environmental analysis for flood, wildfire, landslide, earthquake, and hurricane risk. Know your surroundings. Stay prepared. Act before it's too late.
            </p>

            <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/prediction')} style={{ padding: '0.875rem 1.75rem', fontSize: '0.9375rem' }}>
                <Zap size={16} />
                Check Risk Now
              </button>
              <button className="btn-secondary" onClick={() => navigate('/about')} style={{ padding: '0.875rem 1.5rem', fontSize: '0.9375rem' }}>
                Learn More
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="animate-fade-in-up delay-400" style={{ display: 'flex', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}>
              {[['5', 'Disaster Types'], ['Real-Time', 'Risk Data'], ['Free', 'Always']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p style={{ color: '#14b8a6', fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.125rem' }}>{val}</p>
                  <p style={{ color: '#475569', fontSize: '0.8125rem', margin: 0 }}>{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="tag tag-blue" style={{ marginBottom: '1rem' }}>Core Features</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Five Disaster Categories, <span className="gradient-text">One Platform</span>
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
            Comprehensive environmental risk intelligence covering the most critical natural hazard scenarios.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {features.map(({ icon: Icon, label, desc, color, bg }, i) => (
            <div key={label} className="glass-card card-hover animate-fade-in-up" style={{
              borderRadius: '1rem', padding: '1.5rem',
              background: bg,
              border: `1px solid ${color}20`,
              animationDelay: `${i * 0.08}s`,
              cursor: 'pointer',
            }} onClick={() => navigate('/prediction')}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Icon size={18} color={color} />
              </div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.5rem' }}>{label}</p>
              <p style={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '5rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="tag tag-teal" style={{ marginBottom: '1rem' }}>Process</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {steps.map(({ n, title, desc, icon: Icon }, i) => (
              <div key={n} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                    <div style={{
                      width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
                      background: 'rgba(13, 148, 136, 0.12)',
                      border: '1px solid rgba(13, 148, 136, 0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={15} color="#14b8a6" />
                    </div>
                    <div>
                      <p style={{ color: '#1e3a5f', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.25rem', lineHeight: 1 }}>{n}</p>
                      <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9375rem', margin: '0 0 0.5rem' }}>{title}</p>
                      <p style={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight size={14} color="#1e3a5f" style={{ position: 'absolute', right: '-0.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="tag tag-green" style={{ marginBottom: '1rem' }}>Testimonials</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Trusted by <span className="gradient-text">Safety Professionals</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {testimonials.map(({ name, role, text, rating }, i) => (
            <div key={name} className="glass-card card-hover animate-fade-in-up" style={{
              borderRadius: '1rem', padding: '1.5rem',
              animationDelay: `${i * 0.1}s`
            }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.875rem' }}>
                {Array.from({ length: rating }).map((_, j) => (
                  <span key={j} style={{ color: '#facc15', fontSize: '0.875rem' }}>★</span>
                ))}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 1.25rem', fontStyle: 'italic' }}>
                "{text}"
              </p>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.125rem' }}>{name}</p>
                <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        padding: '5rem 1.5rem',
        background: 'radial-gradient(ellipse at center, rgba(13, 148, 136, 0.08) 0%, transparent 70%)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <AlertTriangle size={28} color="#fb923c" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.875rem', letterSpacing: '-0.02em' }}>
            Don't Wait for a Disaster. <span className="gradient-text-warm">Prepare Now.</span>
          </h2>
          <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
            Check your location's risk profile in seconds. Free, fast, and data-driven.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/prediction')} style={{ padding: '0.875rem 2rem', fontSize: '0.9375rem' }}>
              <Zap size={16} />
              Analyze My Location
            </button>
            <button className="btn-secondary" onClick={() => navigate('/safety')} style={{ padding: '0.875rem 1.75rem', fontSize: '0.9375rem' }}>
              <Shield size={15} />
              Safety Guides
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
