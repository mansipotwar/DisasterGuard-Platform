import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'Riya Sharma', role: 'Emergency Coordinator', org: 'Mumbai Disaster Management', rating: 5, avatar: 'RS', color: '#38bdf8', text: 'DisAlert has become our team\'s go-to resource for pre-storm preparation. The risk cards give us exactly the right information in the right format to brief first responders quickly.' },
  { name: 'Carlos Mendez', role: 'Civil Defense Volunteer', org: 'Mexico City Red Cross', rating: 5, avatar: 'CM', color: '#fb923c', text: 'The earthquake baseline analysis helped us identify three neighborhoods that needed priority outreach. The safety advice section is genuinely practical and jargon-free.' },
  { name: 'Amara Osei', role: 'Community Resilience Officer', org: 'Ghana National Service', rating: 5, avatar: 'AO', color: '#4ade80', text: 'I share the wildfire risk summaries with rural farmers in my district weekly. The plain-English explanations mean even people without technical backgrounds understand the risk clearly.' },
  { name: 'Priya Nair', role: 'Climate Researcher', org: 'IIT Bombay', rating: 5, avatar: 'PN', color: '#f472b6', text: 'The feature importance breakdown in the Analysis section shows real methodological rigor. It\'s rare to find a platform that combines accessibility with this level of scientific transparency.' },
  { name: 'James Okafor', role: 'Field Journalist', org: 'Reuters Africa', rating: 4, avatar: 'JO', color: '#facc15', text: 'I use DisAlert to contextualize disaster coverage. The historical risk index charts and regional analysis save me hours of research before heading into affected areas.' },
  { name: 'Mei Zhang', role: 'Urban Planner', org: 'Shenzhen Municipal Office', rating: 5, avatar: 'MZ', color: '#a78bfa', text: 'The route planning feature is a game changer for emergency logistics. Being able to identify safe alternate routes during active flood events has already improved our response time.' },
  { name: 'Laila Hassan', role: 'NGO Program Manager', org: 'CARE International', rating: 5, avatar: 'LH', color: '#34d399', text: 'We integrated DisAlert into our community preparedness workshops. The interface is clean and the safety guides are thorough — exactly what we needed for training programs.' },
  { name: 'Dr. Samuel Boateng', role: 'Hydrology Professor', org: 'University of Cape Coast', rating: 4, avatar: 'SB', color: '#60a5fa', text: 'Flood risk modeling is notoriously difficult to communicate to the public. DisAlert manages to present complex hydrological data in a format that resonates with non-specialists.' },
  { name: 'Fatima Al-Rashid', role: 'Emergency Health Coordinator', org: 'WHO Regional Office', rating: 5, avatar: 'FA', color: '#fb7185', text: 'During cyclone season, we use DisAlert to pre-position medical supplies in regions showing early hurricane risk indicators. The 7-day forecast modal is especially useful for planning.' },
];

export default function Testimonials() {
  return (
    <div className="page-container" style={{ padding: '5rem 1.5rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="tag tag-green" style={{ marginBottom: '1rem' }}>Testimonials</div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
          Trusted by Safety Professionals
        </h1>
        <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          See how emergency managers, researchers, and field workers rely on DisAlert for life-critical decisions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {testimonials.map(({ name, role, org, rating, avatar, color, text }, i) => (
          <div key={name} className="glass-card card-hover animate-fade-in-up" style={{
            borderRadius: '1rem', padding: '1.5rem', position: 'relative',
            animationDelay: `${i * 0.06}s`
          }}>
            <Quote size={20} color={`${color}30`} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }} />

            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.875rem' }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={13} color={j < rating ? '#facc15' : '#1e293b'} fill={j < rating ? '#facc15' : 'none'} />
              ))}
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.75, margin: '0 0 1.25rem', fontStyle: 'italic' }}>
              "{text}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                background: `${color}20`, border: `2px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: color, fontWeight: 800, fontSize: '0.6875rem' }}>{avatar}</span>
              </div>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{name}</p>
                <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0.125rem 0 0' }}>{role}, {org}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
