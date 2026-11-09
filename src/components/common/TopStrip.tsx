import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import { Surface } from '../../types';

export const TopStrip: React.FC = () => {
  const { surface, setSurface, theme, toggleTheme, resetAllData } = useApp();

  const surfaces: [Surface, string][] = [
    ['public', 'Careers site'],
    ['staff', 'Staff workspace'],
    ['client', 'Client portal']
  ];

  return (
    <div id="strip" className="strip gut">
      <div className="inner">
        <span className="tag">Prototype · sample data</span>

        <div className="seg" role="group" aria-label="Preview surface">
          {surfaces.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSurface(key)}
              aria-pressed={surface === key}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="row" style={{ gap: '6px' }}>
          <button
            type="button"
            className="iconbtn"
            onClick={resetAllData}
            aria-label="Reset prototype data"
            title="Reset data to defaults"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className="iconbtn"
            onClick={toggleTheme}
            aria-label="Switch colour theme"
            title="Switch colour theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
};
