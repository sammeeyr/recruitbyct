import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Shield, User } from 'lucide-react';
import { Surface } from '../../types';

export const TopStrip: React.FC = () => {
  const { surface, setSurface, theme, toggleTheme, setSelectedClientId } = useApp();
  const { user, allUsers, switchUser } = useAuth();

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    switchUser(selectedUserId);
    const target = allUsers.find(u => u.id === selectedUserId);
    if (target) {
      if (target.role === 'client') {
        if (target.clientId) setSelectedClientId(target.clientId);
        setSurface('client');
      } else if (target.role === 'recruiter' || target.role === 'agency_admin') {
        setSurface('staff');
      } else {
        setSurface('public');
      }
    }
  };

  const surfaces: [Surface, string][] = [
    ['public', 'Careers site'],
    ['staff', 'Staff workspace'],
    ['client', 'Client portal']
  ];

  return (
    <div id="strip" className="strip gut">
      <div className="inner">
        {/* User Session & Role Indicator */}
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
          <Shield size={14} style={{ color: 'var(--yellow)' }} />
          <span className="tag" style={{ color: 'var(--on-black)', fontWeight: 600 }}>
            Session:
          </span>
          <select
            value={user.id}
            onChange={handleUserChange}
            style={{
              background: '#1C1C1F',
              color: '#F5F5F3',
              border: '1px solid #2E2E33',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 500,
              minHeight: '28px',
              width: 'auto'
            }}
          >
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Surface switcher */}
        <div className="seg" role="group" aria-label="Active workspace surface">
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

        {/* Theme switcher */}
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
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
