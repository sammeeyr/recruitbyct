import React from 'react';
import { useApp } from '../../context/AppContext';
import { View } from '../../types';
import {
  Home,
  Kanban,
  Users,
  Briefcase,
  Sparkles,
  Bell
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { view, navigate, openNotifications, unreadNotificationCount } = useApp();

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Home', icon: <Home size={20} /> },
    { key: 'pipeline', label: 'Pipeline', icon: <Kanban size={20} /> },
    { key: 'pool', label: 'Talent', icon: <Users size={20} /> },
    { key: 'chat-data', label: 'AI Copilot', icon: <Sparkles size={20} /> },
    { key: 'job-orders', label: 'Jobs', icon: <Briefcase size={20} /> }
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: 'var(--mobile-nav-bg, rgba(17, 17, 19, 0.94))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        paddingTop: '6px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
        paddingRight: 'max(8px, env(safe-area-inset-right, 8px))',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.35)'
      }}
    >
      {navItems.map(item => {
        const isActive = view === item.key;
        const isAi = item.key === 'chat-data';

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 2px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive
                ? isAi
                  ? 'var(--brand-ai, #A855F7)'
                  : 'var(--red)'
                : 'var(--muted)',
              transition: 'color 0.15s ease, transform 0.15s ease',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '28px',
                borderRadius: '8px',
                background: isActive
                  ? isAi
                    ? 'rgba(168, 85, 247, 0.16)'
                    : 'rgba(230, 57, 70, 0.14)'
                  : 'transparent',
                transition: 'background 0.15s ease'
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Notifications Drawer Button with Unread Badge */}
      <button
        type="button"
        onClick={openNotifications}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '6px 2px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          position: 'relative'
        }}
        aria-label={`Open notifications (${unreadNotificationCount} unread)`}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '28px'
          }}
        >
          <Bell size={20} />
          {unreadNotificationCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '0px',
                minWidth: '15px',
                height: '15px',
                borderRadius: '9999px',
                background: 'var(--red)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingInline: '3px',
                boxShadow: '0 0 6px rgba(230, 57, 70, 0.6)'
              }}
            >
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap'
          }}
        >
          Alerts
        </span>
      </button>
    </nav>
  );
};
