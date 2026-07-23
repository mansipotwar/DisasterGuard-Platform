import { BarChart2, Globe, Route, Shield, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const team = [
  { name: 'Arjun Kapoor', role: 'Lead Engineer & Co-Founder', avatar: 'AK', color: '#38bdf8' },
  { name: 'Seo-Yeon Park', role: 'Data Science Lead', avatar: 'SP', color: '#4ade80' },
  { name: 'Daniela Cruz', role: 'UX & Product Design', avatar: 'DC', color: '#fb923c' },
  { name: 'Ibrahim Al-Farsi', role: 'Disaster Risk Analyst', avatar: 'IF', color: '#facc15' },
];

const founder = {
  name: "Mansi N. Potwar",
  role: "Founder • AI & Full-Stack Developer",
  image: "/founder.jpg",
  about1:
    "Driven by innovation and a passion for protecting communities, I created DisasterGuard to transform complex disaster data into intelligent, life-saving insights. Every feature reflects my vision of using AI to make preparedness smarter, faster, and more accessible.",

  about2:
    "From designing the user experience to developing the AI models and full-stack architecture, I built DisasterGuard as a platform that demonstrates how technology can create meaningful real-world impact. My mission is to continue building intelligent solutions that help people stay informed, prepared, and safe.",
};

const values = [
  { icon: Shield, label: 'Safety First', desc: 'Every design decision prioritizes accurate, life-saving information delivery.', color: '#14b8a6' },
  { icon: Zap, label: 'Real-Time Intelligence', desc: 'Environmental data refreshed continuously to reflect current conditions.', color: '#fb923c' },
  { icon: Globe, label: 'Global Coverage', desc: 'Any location on Earth can be analyzed, regardless of infrastructure.', color: '#38bdf8' },
  { icon: Users, label: 'Community Focused', desc: 'Designed for emergency managers, NGOs, researchers, and everyday citizens.', color: '#4ade80' },
  { icon: BarChart2, label: 'Transparent Methodology', desc: 'Full visibility into how predictions are made and what factors drive risk scores.', color: '#a78bfa' },
  { icon: Route, label: 'Actionable Guidance', desc: 'Beyond data — practical safety steps and navigation for every scenario.', color: '#facc15' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ padding: '5rem 1.5rem 3rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem' }}>
        <div className="tag tag-teal" style={{ marginBottom: '1rem' }}>About</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
          Built to Save Lives Through <span className="gradient-text">Early Warning</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.8, maxWidth: '680px', margin: 0 }}>
          DisasterGuard is an early disaster detection and safety intelligence platform that transforms complex environmental data into simple, actionable risk awareness. We believe that knowledge is the first line of defense against natural hazards.
        </p>
      </div>

      <div className="glass-card" style={{ borderRadius: '1.25rem', padding: '2rem', marginBottom: '2rem', background: 'rgba(13, 148, 136, 0.04)', border: '1px solid rgba(13, 148, 136, 0.12)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>Our Mission</h2>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', lineHeight: 1.8, margin: 0 }}>
          Natural disasters claim thousands of lives annually — not because people lack courage or resources, but because they lack timely, understandable information. DisAlert bridges that gap. By aggregating atmospheric, geological, and environmental data into a unified risk intelligence layer, we give individuals and emergency organizations the awareness they need to prepare, adapt, and respond before conditions become catastrophic.
        </p>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem' }}>Our Core Values</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {values.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="glass-card" style={{ borderRadius: '0.875rem', padding: '1.125rem', display: 'flex', gap: '0.875rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={color} />
              </div>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.875rem', margin: '0 0 0.25rem' }}>{label}</p>
                <p style={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "2.5rem" }}>
  <h2
    style={{
      fontSize: "1.25rem",
      fontWeight: 800,
      margin: "0 0 1.5rem",
    }}
  >
    Meet Our Team
  </h2>

  {/* Founder */}
  <div
    className="glass-card"
    style={{
      borderRadius: "1.25rem",
      padding: "2rem",
      display: "grid",
      gridTemplateColumns: "340px 1fr",
      gap: "2rem",
      alignItems: "center",
      marginBottom: "2rem",
    }}
  >
    <img
      src={founder.image}
      alt={founder.name}
      style={{
        width: "100%",
        height: "370px",
        objectFit: "cover",
        borderRadius: "18px",
      }}
    />

    <div>
      <span
  style={{
    display: "inline-block",
    background: "rgba(168,85,247,.15)",
    color: "#c084fc",
    padding: "8px 18px",
    borderRadius: "999px",
    border: "1px solid rgba(192,132,252,.35)",
    fontSize: ".82rem",
    fontWeight: 700,
    marginBottom: "1rem",
  }}
>
  ✨ Visionary Behind DisasterGuard
</span>

      <h2
  style={{
    color: "#fff",
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: ".35rem",
  }}
>
  {founder.name}
</h2>

      <p
        style={{
          color: "#38bdf8",
          fontWeight: 600,
          marginBottom: "1.2rem",
        }}
      >
        {founder.role}
      </p>

      <div
  style={{
    color: "#94a3b8",
    fontSize: ".79rem",
    lineHeight: 1.9,
  }}
>
  <p style={{ marginBottom: "0.5rem" }}>
    {founder.about1}
  </p>

  <p style={{ margin: 0 }}>
    {founder.about2}
  </p>
</div>
    </div>
  </div>

  {/* Team Members */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
      gap: "1rem",
    }}
  >
    {team.slice(1).map(({ name, role, avatar, color }) => (
      <div
        key={name}
        className="glass-card"
        style={{
          borderRadius: "1rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: `${color}18`,
            border: `2px solid ${color}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <span
            style={{
              color,
              fontWeight: 800,
              fontSize: "1rem",
            }}
          >
            {avatar}
          </span>
        </div>

        <h3
          style={{
            color: "#fff",
            marginBottom: ".3rem",
          }}
        >
          {name}
        </h3>

        <p
          style={{
            color,
            fontWeight: 600,
            marginBottom: ".7rem",
          }}
        >
          {role}
        </p>

        <p
          style={{
            color: "#94a3b8",
            fontSize: ".82rem",
            lineHeight: 1.7,
          }}
        >
          Dedicated to advancing intelligent disaster monitoring, predictive
          analytics, and public safety through innovative technology.
        </p>
      </div>
    ))}
  </div>
</div>

      <div className="glass-card" style={{ borderRadius: '1.25rem', padding: '2rem', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(13, 148, 136, 0.07) 0%, transparent 70%)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.75rem' }}>Ready to check your risk?</h2>
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>Analyze any location on Earth in seconds.</p>
        <button className="btn-primary" onClick={() => navigate('/prediction')} style={{ padding: '0.75rem 2rem' }}>
          <Zap size={15} />
          Start Risk Analysis
        </button>
      </div>
    </div>
  );
}
