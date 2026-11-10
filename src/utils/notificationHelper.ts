export interface AppNotification {
  id: string;
  type: 'application' | 'interview' | 'placement' | 'reminder' | 'syndication';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetView?: string;
  actionUrl?: string;
  metadata?: {
    candidateName?: string;
    jobTitle?: string;
    score?: number;
  };
}

const STORAGE_KEY = 'recruitbyct_notifications_v1';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'application',
    title: 'New Candidate Applied',
    message: 'Tunde Adeleke applied to Customer Experience / Growth Strategist (Abuja). AI Score: 85%.',
    timestamp: '10 mins ago',
    read: false,
    targetView: 'pipeline',
    metadata: {
      candidateName: 'Tunde Adeleke',
      jobTitle: 'Customer Experience / Growth Strategist',
      score: 85
    }
  },
  {
    id: 'notif_2',
    type: 'interview',
    title: 'AI Screening Interview Completed',
    message: 'Grace Nwawo finished 24/7 AI Interview. AI Evaluation: 92% (Strong Hire recommendation).',
    timestamp: '45 mins ago',
    read: false,
    targetView: 'job-orders',
    metadata: {
      candidateName: 'Grace Nwawo',
      jobTitle: 'Customer Experience / Growth Strategist',
      score: 92
    }
  },
  {
    id: 'notif_3',
    type: 'syndication',
    title: 'Syndicated to 2,500+ Channels',
    message: 'Customer Experience / Growth Strategist is now live on Google for Jobs, Indeed XML, and Jobberman.',
    timestamp: '2 hours ago',
    read: true,
    targetView: 'job-orders'
  },
  {
    id: 'notif_4',
    type: 'reminder',
    title: 'Interview Reminder',
    message: 'Client technical interview with Candidate A-102 scheduled for 2:30 PM today.',
    timestamp: '3 hours ago',
    read: true,
    targetView: 'pipeline'
  },
  {
    id: 'notif_5',
    type: 'placement',
    title: 'Placement Fee Invoice Paid',
    message: 'Listing fee ₦10,000 confirmed for Beauty by Lani Spa via Paystack.',
    timestamp: 'Yesterday',
    read: true,
    targetView: 'placements'
  }
];

export function getStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifs: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('recruitbyct_notifications_changed'));
  } catch (e) {
    console.warn('[Notification Storage]', e);
  }
}

export function getUnreadNotificationCount(): number {
  return getStoredNotifications().filter(n => !n.read).length;
}

export function addStoredNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const current = getStoredNotifications();
  const created: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: 'Just now',
    read: false
  };
  const updated = [created, ...current];
  saveStoredNotifications(updated);
  return created;
}

/**
 * Request native browser/mobile push notification permissions
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('[Push Notification Permission]', err);
    return 'denied';
  }
}

/**
 * Send native push notification to device via Service Worker
 */
export async function sendNativePushNotification(
  title: string,
  body: string,
  url = '/dashboard'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await requestPushPermission();
    if (perm !== 'granted') return false;
  }

  try {
    // Play subtle audio alert if supported
    playNotificationChime();

    // Use ServiceWorkerRegistration if active
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/favicon-32x32.png',
          vibrate: [100, 50, 100],
          data: { url }
        } as any);
        return true;
      }
    }

    // Direct Notification fallback
    new Notification(title, {
      body,
      icon: '/icon-192.png'
    });
    return true;
  } catch (e) {
    console.warn('[Native Push Notification Error]', e);
    return false;
  }
}

/**
 * Subtle audio chime for in-app alert feedback
 */
export function playNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}
