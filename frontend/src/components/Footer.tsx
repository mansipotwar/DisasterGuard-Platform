import { NavLink } from 'react-router-dom';
import { Shield, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(10, 15, 30, 0.95)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      marginTop: 'auto',
      padding: '3rem 1.5rem 1.5rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
                background: 'linear-gradient(135deg, #0d9488, #0891b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={12} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#e2e8f0' }}>
                Dis<span className="gradient-text">Alert</span>
              </span>
            </div>
            <p style={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.7, maxWidth: '240px', margin: 0 }}>
              Early disaster detection and safety intelligence platform. Protecting communities through data-driven risk awareness.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {[Github, Twitter, Mail].map((Icon, i) => (
                <button key={i} className="btn-ghost" style={{ padding: '0.375rem', borderRadius: '0.375rem' }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform
            </p>
            {['/prediction', '/analysis', '/safety', '/route', '/weather'].map((path, i) => (
              <NavLink key={i} to={path} style={{ display: 'block', color: '#475569', fontSize: '0.8125rem', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                {path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}
              </NavLink>
            ))}
          </div>

          <div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company
            </p>
            {['/about', '/news', '/testimonials', '/contact'].map((path, i) => (
              <NavLink key={i} to={path} style={{ display: 'block', color: '#475569', fontSize: '0.8125rem', textDecoration: 'none', padding: '0.25rem 0', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                {path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}
              </NavLink>
            ))}
          </div>

          <div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Disasters Covered
            </p>
            {['Flood Detection', 'Wildfire Risk', 'Landslide Analysis', 'Earthquake Baseline', 'Hurricane Awareness'].map((item, i) => (
              <p key={i} style={{ color: '#475569', fontSize: '0.8125rem', margin: '0 0 0.25rem 0' }}>{item}</p>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ color: '#334155', fontSize: '0.75rem', margin: 0 }}>
            2024 DisAlert. Built for early warning and community safety.
          </p>
          <p style={{ color: '#334155', fontSize: '0.75rem', margin: 0 }}>
            Data for awareness only. Always follow official emergency services.
          </p>
        </div>
      </div>
    </footer>
  );
}
