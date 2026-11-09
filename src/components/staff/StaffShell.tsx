import React from 'react';
import { useApp } from '../../context/AppContext';
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
  Cloud
} from 'lucide-react';

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
  const { view, navigate, approvals, driveConnected } = useApp();

  const navItems: [View, React.ReactNode, string][] = [
    ['dashboard', <Home size={18} key="d" />, 'Dashboard'],
    ['pipeline', <Kanban size={18} key="p" />, 'Pipeline'],
    ['pool', <Users size={18} key="u" />, 'Talent pool'],
    ['job-orders', <Briefcase size={18} key="j" />, 'Job orders'],
    ['clients', <Building size={18} key="c" />, 'Clients'],
    ['placements', <Award size={18} key="pl" />, 'Placements'],
    ['intake', <Inbox size={18} key="i" />, 'Intake'],
    ['drive-sync', <Cloud size={18} key="dr" />, 'Drive sync']
  ];

  const pendingApprovalsCount = approvals.length;

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

        <div className="who">
          <b>Folake Adeyemi</b>
          Recruiter · Abuja
          <br />
          {driveConnected ? 'Google Drive connected' : 'Google Drive disconnected'}
        </div>
      </aside>

      <main className="main">
        <div className="pagehead">
          <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  );
};
