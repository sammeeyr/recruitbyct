import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { View } from '../../types';
import {
  Home,
  Kanban,
  Users,
  Briefcase,
  Building,
  Award,
  Inbox,
  Cloud,
  Sun,
  Moon,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  LogOut,
  Sliders,
  Sparkles,
  Bell
} from 'lucide-react';
import { MobileNav } from '../layout/MobileNav';

interface StaffShellProps {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const StaffShell: React.FC<StaffShellProps> = ({
  title,
  sub,
  actions,
  children
}) => {
  const {
    view,
    navigate,
    approvals,
    driveConnected,
    theme,
    toggleTheme,
    setSurface,
    setSelectedClientId,
    openNotifications,
    unreadNotificationCount
  } = useApp();
  const { user, allUsers, switchUser, logout } = useAuth();

  const navItems: [View, React.ReactNode, string][] = [
    ['dashboard', <Home size={18} key="d" />, 'Dashboard'],
    ['pipeline', <Kanban size={18} key="p" />, 'Pipeline'],
    ['pool', <Users size={18} key="u" />, 'Talent pool'],
    ['chat-data', <Sparkles size={18} key="ai" />, 'AI Copilot'],
    ['job-orders', <Briefcase size={18} key="j" />, 'Job orders'],
    ['clients', <Building size={18} key="c" />, 'Clients'],
    ['placements', <Award size={18} key="pl" />, 'Placements'],
    ['intake', <Inbox size={18} key="i" />, 'Intake'],
    ['drive-sync', <Cloud size={18} key="dr" />, 'Drive sync'],
    ['admin', <Sliders size={18} key="adm" />, 'Admin panel']
  ];

  const pendingApprovalsCount = approvals.length;

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

  return (
    <div className="shell">
      <aside className="side">
        <a
          className="brand onblack"
          href="/dashboard"
          onClick={e => {
            e.preventDefault();
            navigate('dashboard');
          }}
          aria-label="Cube Tech Consults dashboard"
        >
          <Logo />
          <span className="wm">
            <b>CUBE TECH</b>
            <i>Consults</i>
          </span>
        </a>

        <nav aria-label="Staff navigation">
          {navItems.map(([itemKey, icon, label]) => (
            <button
              key={itemKey}
              type="button"
              className="navbtn"
              onClick={() => navigate(itemKey)}
              aria-current={view === itemKey ? 'page' : undefined}
            >
              {icon}
              {label}
              {itemKey === 'dashboard' && pendingApprovalsCount > 0 && (
                <span
                  className="count"
                  aria-label={`${pendingApprovalsCount} items need approval`}
                >
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer with Authenticated Profile, Neon Status & Quick Links */}
        <div className="who" style={{ marginTop: 'auto', borderTop: '1px solid var(--line-on-black)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Neon Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="iconbtn"
                onClick={openNotifications}
                aria-label={`Notifications (${unreadNotificationCount} unread)`}
                title="Notifications"
                style={{ color: unreadNotificationCount > 0 ? 'var(--yellow)' : '#A1A1AA', padding: '4px', position: 'relative' }}
              >
                <Bell size={14} />
                {unreadNotificationCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--red)',
                      boxShadow: '0 0 6px var(--red)'
                    }}
                  />
                )}
              </button>
              <button
                type="button"
                className="iconbtn"
                onClick={toggleTheme}
                aria-label="Switch theme"
                title="Switch theme"
                style={{ color: '#A1A1AA', padding: '4px' }}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--red)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </b>
              <span className="muted xs" style={{ textTransform: 'capitalize' }}>
                {user.role.replace('_', ' ')} · {user.location || 'Abuja'}
              </span>
            </div>
          </div>

          {/* Quick Account Switcher */}
          <div style={{ marginTop: '6px' }}>
            <label className="xs muted" style={{ display: 'block', marginBottom: '3px' }}>
              Active account
            </label>
            <select
              value={user.id}
              onChange={handleUserChange}
              style={{
                width: '100%',
                background: '#1C1C1F',
                color: '#F5F5F3',
                border: '1px solid #2E2E33',
                borderRadius: '6px',
                padding: '4px 6px',
                fontSize: '11px'
              }}
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #2E2E33' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="linkbtn xs"
                onClick={() => navigate('careers')}
                style={{ color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                Careers <ExternalLink size={10} />
              </button>
              <button
                type="button"
                className="linkbtn xs"
                onClick={() => navigate('client-portal')}
                style={{ color: '#A1A1AA', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                Portal <ExternalLink size={10} />
              </button>
            </div>

            <button
              type="button"
              className="linkbtn xs"
              onClick={() => {
                logout();
                navigate('login');
              }}
              style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
              title="Sign out of Recruiter Session"
            >
              Sign out <LogOut size={10} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="mobile-topbar">
          <a
            className="brand onblack"
            href="/dashboard"
            onClick={e => {
              e.preventDefault();
              navigate('dashboard');
            }}
            aria-label="Cube Tech Consults dashboard"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Logo />
            <span className="wm" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <b style={{ fontSize: '15px', color: 'var(--ink)' }}>CUBE TECH</b>
              <i style={{ fontSize: '10px', color: 'var(--muted)' }}>Consults · Mobile ATS</i>
            </span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="iconbtn"
              onClick={openNotifications}
              style={{ position: 'relative', padding: '6px' }}
              aria-label="Open notifications"
            >
              <Bell size={18} style={{ color: unreadNotificationCount > 0 ? 'var(--yellow)' : 'var(--ink)' }} />
              {unreadNotificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                    boxShadow: '0 0 6px var(--red)'
                  }}
                />
              )}
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={toggleTheme}
              style={{ padding: '6px' }}
              aria-label="Switch theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="pagehead">
          <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
        </div>

        {children}
      </main>

      <MobileNav />
    </div>
  );
};
