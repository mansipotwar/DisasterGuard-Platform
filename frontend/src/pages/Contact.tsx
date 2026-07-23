import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.from('contacts').insert(form);
    setLoading(false);
    if (error) {
      setError('Failed to send message. Please try again.');
    } else {
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    }
  };

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@disalert.io', color: '#38bdf8' },
    { icon: Phone, label: 'Emergency Hotline', value: '+1 (800) DISALRT', color: '#4ade80' },
    { icon: MapPin, label: 'Headquarters', value: 'Global Remote Team', color: '#fb923c' },
  ];

  return (
    <div className="page-container" style={{ padding: '5rem 1.5rem 3rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="tag tag-teal" style={{ marginBottom: '0.875rem' }}>Contact</div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Get in Touch
        </h1>
        <p style={{ color: '#475569', fontSize: '0.9375rem', margin: 0 }}>
          Questions about DisAlert? We're here to help.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
            {contactInfo.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card" style={{ borderRadius: '0.875rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <div>
                  <p style={{ color: '#475569', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', margin: '0.125rem 0 0' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem', background: 'rgba(13, 148, 136, 0.04)', border: '1px solid rgba(13, 148, 136, 0.12)' }}>
            <p style={{ color: '#14b8a6', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.5rem' }}>Emergency Services</p>
            <p style={{ color: '#475569', fontSize: '0.8125rem', lineHeight: 1.65, margin: 0 }}>
              For active disaster emergencies, always contact your local emergency services (911, 999, 112) directly. DisAlert provides risk awareness, not emergency response.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ borderRadius: '1.25rem', padding: '1.75rem' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle size={40} color="#4ade80" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, fontSize: '1.125rem', margin: '0 0 0.5rem' }}>Message Sent!</h3>
              <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
                Thank you for reaching out. Our team will respond within 24 hours.
              </p>
              <button className="btn-secondary" onClick={() => setSubmitted(false)} style={{ marginTop: '1.25rem' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', margin: '0 0 1.25rem' }}>Send a Message</h3>

              {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>Full Name</label>
                  <input type="text" className="input-field" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
                  <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>Message</label>
                  <textarea
                    className="input-field"
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                    rows={4}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '0.75rem' }}>
                  <Send size={15} />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
