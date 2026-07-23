import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, LogIn, UserPlus, Menu, X, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const navLinks = [
  { to: '/home', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/prediction', label: 'Prediction' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/safety', label: 'Safety' },
  { to: '/route', label: 'Route' },
  { to: '/weather', label: 'Weather' },
  { to: '/news', label: 'News' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const { user, isGuest, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--bg-header)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-header)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.25rem', height: '3.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NavLink to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #0d9488, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)',
          }}>
            <ShieldAlert size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Disaster<span className="gradient-text">Guard</span>
          </span>
        </NavLink>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, justifyContent: 'center', overflowX: 'auto' }} className="dg-hide-mobile">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '2rem', height: '2rem', borderRadius: '0.5rem',
              background: 'var(--bg-btn-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
            }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark
              ? <Sun size={14} color="#facc15" />
              : <Moon size={14} color="#0891b2" />
            }
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="dg-hide-mobile">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.625rem',
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                borderRadius: '9999px',
              }}>
                <User size={11} color="#0d9488" />
                <span style={{ color: '#0d9488', fontSize: '0.75rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button className="btn-ghost" onClick={handleSignOut} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          ) : isGuest ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="dg-hide-mobile">
              <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '9999px', color: '#ca8a04', fontSize: '0.6875rem', fontWeight: 700 }}>
                Guest
              </span>
              <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
                <LogIn size={13} /> Sign In
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="dg-hide-mobile">
              <button className="btn-ghost" onClick={() => navigate('/login')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
                <LogIn size={13} /> Login
              </button>
              <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>
                <UserPlus size={13} /> Sign Up
              </button>
            </div>
          )}

          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: '2rem', height: '2rem', borderRadius: '0.5rem',
              background: 'var(--bg-btn-secondary)', border: '1px solid var(--border-color)',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
            className="dg-show-mobile"
          >
            {menuOpen ? <X size={16} color="var(--text-primary)" /> : <Menu size={16} color="var(--text-primary)" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          background: 'var(--bg-header)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-color)',
          padding: '0.75rem 1.25rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'block' }}
            >
              {link.label}
            </NavLink>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            {user ? (
              <button className="btn-ghost" onClick={handleSignOut} style={{ fontSize: '0.8125rem' }}>
                <LogOut size={13} /> Sign Out
              </button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => { navigate('/login'); setMenuOpen(false); }} style={{ fontSize: '0.8125rem' }}>
                  <LogIn size={13} /> Login
                </button>
                <button className="btn-primary" onClick={() => { navigate('/signup'); setMenuOpen(false); }} style={{ fontSize: '0.8125rem' }}>
                  <UserPlus size={13} /> Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .dg-hide-mobile { display: none !important; }
          .dg-show-mobile { display: flex !important; }
        }
        @media (min-width: 1025px) {
          .dg-show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
