import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AppNotification,
  getStoredNotifications,
  saveStoredNotifications,
  sendNativePushNotification,
  requestPushPermission,
  playNotificationChime
} from '../../utils/notificationHelper';
import {
  X,
  Bell,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  Users,
  Briefcase,
  Trash2,
  Check,
  Send,
  Volume2
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const { navigate, showToast } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminders'>('all');
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setNotifications(getStoredNotifications());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setHasPermission(Notification.permission === 'granted');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
    showToast('All notifications marked as read.');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleItemClick = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    onClose();
    if (notif.targetView) {
      navigate(notif.targetView as any);
    }
  };

  const handleRequestPush = async () => {
    const perm = await requestPushPermission();
    if (perm === 'granted') {
      setHasPermission(true);
      await sendNativePushNotification(
        'Recruitbyct Push Enabled',
        'You will now receive instant recruitment alerts and reminders on this device.'
      );
      showToast('Push notifications enabled for this device!');
    } else {
      showToast('Notification permission was declined in browser.');
    }
  };

  const handleSendTestNotification = async () => {
    playNotificationChime();
    const sent = await sendNativePushNotification(
      'New Candidate Application',
      'Chidera Nwosu applied for Customer Experience Strategist. AI Match: 91% (Strong Fit).'
    );

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'application',
      title: 'New Candidate Applied',
      message: 'Chidera Nwosu applied for Customer Experience Strategist. AI Match: 91%.',
      timestamp: 'Just now',
      read: false,
      targetView: 'pipeline'
    };

    const nextList = [newNotif, ...notifications];
    setNotifications(nextList);
    saveStoredNotifications(nextList);

    if (sent) {
      showToast('Dispatched native push alert to device!');
    } else {
      showToast('Notification added to Notification Center.');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'reminders') return n.type === 'reminder';
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'application':
        return <Users size={16} style={{ color: '#0A66C2' }} />;
      case 'interview':
        return <Sparkles size={16} style={{ color: 'var(--yellow)' }} />;
      case 'placement':
        return <Award size={16} style={{ color: '#10B981' }} />;
      case 'reminder':
        return <Clock size={16} style={{ color: '#F59E0B' }} />;
      case 'syndication':
        return <Briefcase size={16} style={{ color: '#8B5CF6' }} />;
      default:
        return <Bell size={16} style={{ color: 'var(--ink)' }} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} style={{ color: 'var(--yellow)' }} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '17px' }}>Recruitment Notifications</h3>
          </div>

          <button
            type="button"
            className="iconbtn"
            onClick={onClose}
            aria-label="Close notifications drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Permission & Test Bar */}
        <div
          style={{
            padding: '10px 18px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          {!hasPermission ? (
            <button
              type="button"
              className="linkbtn xs"
              onClick={handleRequestPush}
              style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Bell size={12} /> Enable Native Device Push Alerts
            </button>
          ) : (
            <span className="xs" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} strokeWidth={3} /> Device Push Enabled
            </span>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn ghost xs"
              onClick={handleSendTestNotification}
              style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Test push notification alert"
            >
              <Send size={11} /> Test Alert
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="linkbtn xs"
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '11px' }}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '10px 18px', borderBottom: '1px solid var(--line)' }}>
          {[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'reminders', label: 'Reminders' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className="btn ghost xs"
              onClick={() => setFilter(tab.key as any)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: filter === tab.key ? 'var(--yellow)' : 'transparent',
                color: filter === tab.key ? '#1A1400' : 'var(--ink)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
              <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p className="xs" style={{ margin: 0 }}>
                No notifications right now. You are completely up to date!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    background: notif.read ? 'var(--surface-2)' : 'rgba(255, 204, 0, 0.06)',
                    border: notif.read ? '1px solid var(--line)' : '1px solid rgba(255, 204, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getIconForType(notif.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{notif.title}</b>
                        <span className="xs muted" style={{ fontSize: '10px' }}>{notif.timestamp}</span>
                      </div>

                      <p className="xs muted" style={{ margin: '4px 0 0', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="iconbtn"
                      onClick={e => handleDelete(notif.id, e)}
                      style={{ color: 'var(--muted)', padding: '2px', opacity: 0.6 }}
                      title="Dismiss notification"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {!notif.read && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '20px',
                        borderRadius: '2px',
                        background: 'var(--yellow)'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="xs muted">Recruitbyct Progressive Web App</span>
          <span className="xs muted font-mono">24/7 Mobile Sync</span>
        </div>
      </div>
    </div>
  );
};
