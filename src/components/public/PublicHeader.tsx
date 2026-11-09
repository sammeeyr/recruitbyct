import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { Sun, Moon, ArrowRight, Lock, LayoutDashboard } from 'lucide-react';

export const PublicHeader: React.FC = () => {
  const { view, navigate, theme, toggleTheme } = useApp();
  const { canAccessAts, user } = useAuth();

  return (
    <header className="hdr gut" style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
      <div className="inner">
        <a
          className="brand"
          href="/careers"
          onClick={e => {
            e.preventDefault();
            navigate('careers');
          }}
          aria-label="Cube Tech Consults home"
        >
          <Logo />
          <span className="wm">
            <b>CUBE TECH</b>
            <i>Consults</i>
          </span>
        </a>

        <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('careers')}
            aria-current={view === 'careers' ? 'page' : undefined}
          >
            Open roles
          </button>
          <button
            type="button"
            onClick={() => navigate('track')}
            aria-current={view === 'track' ? 'page' : undefined}
          >
            Track my application
          </button>
          <button
            type="button"
            onClick={() => navigate('onboard')}
            aria-current={view === 'onboard' ? 'page' : undefined}
            style={{ fontWeight: 600, color: 'var(--red-text)' }}
          >
            Recruiter partner
          </button>
          <button
            type="button"
            onClick={() => navigate('client-portal')}
            aria-current={view === 'client-portal' ? 'page' : undefined}
          >
            Client portal
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 4px' }} />

          {canAccessAts ? (
            <button
              type="button"
              onClick={() => navigate('dashboard')}
              className="btn ghost sm"
              style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <LayoutDashboard size={13} /> Recruiter ATS <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('login')}
              className="btn primary sm"
              style={{ fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Lock size={13} /> Recruiter Sign In
            </button>
          )}

          <button
            type="button"
            className="iconbtn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ marginLeft: '4px' }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </nav>
      </div>
    </header>
  );
};
