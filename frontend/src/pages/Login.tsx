import { AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    setLoading(false);

    if (success) {
      navigate('/dashboard'); // ✅ goes to dashboard (not home now)
    } else {
      setError('Invalid email or password');
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/home');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(ellipse at 30% 40%, rgba(13, 148, 136, 0.12) 0%, transparent 60%), #0a0f1e'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(135deg, #0d9488, #0891b2)',
            borderRadius: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Shield size={20} color="white" />
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0 0 0.375rem',
            color: '#e2e8f0'
          }}>
            Welcome back
          </h1>

          <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0 }}>
            Sign in to your IntelliGuard account
          </p>
        </div>

        {/* CARD */}
        <div className="glass-card" style={{ borderRadius: '1.25rem', padding: '1.75rem' }}>

          {/* ERROR */}
          {error && (
            <div style={{
              display: 'flex',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.625rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={15} color="#f87171" />
              <span style={{ color: '#f87171', fontSize: '0.8125rem' }}>
                {error}
              </span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* EMAIL */}
            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.8125rem',
                marginBottom: '0.5rem'
              }}>
                Email address
              </label>

              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.8125rem',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '0.25rem'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* DIVIDER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }} />
            <span style={{ color: '#334155', fontSize: '0.75rem' }}>or</span>
            <div style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }} />
          </div>

          {/* GUEST */}
          <button
            className="btn-secondary"
            onClick={handleGuest}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            Continue as Guest
          </button>

          {/* SIGNUP */}
          <p style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: '0.8125rem',
            marginTop: '1.25rem'
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#14b8a6', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}