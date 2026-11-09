import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';

export const PublicHeader: React.FC = () => {
  const { view, navigate } = useApp();

  return (
    <header className="hdr gut">
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

        <nav aria-label="Main navigation">
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
        </nav>
      </div>
    </header>
  );
};
