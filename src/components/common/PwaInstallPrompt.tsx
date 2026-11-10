import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check, Share, PlusSquare } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running standalone
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isApp) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('recruitbyct_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice && !isApp) {
      // Delay showing iOS prompt slightly
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('recruitbyct_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '520px',
          zIndex: 9998,
          background: 'rgba(18, 18, 20, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 204, 0, 0.3)',
          borderRadius: '14px',
          padding: '14px 16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 204, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--yellow)',
              color: '#1A1400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Smartphone size={22} />
          </div>

          <div style={{ minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '13px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Install Recruitbyct App
            </b>
            <p className="xs muted" style={{ margin: 0, fontSize: '11px', lineHeight: '1.3' }}>
              Recruit on the go from your computer, phone, or tablet with instant notifications.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn primary sm"
            onClick={handleInstallClick}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              background: 'var(--yellow)',
              borderColor: 'var(--yellow)',
              color: '#1A1400',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Download size={13} /> {isIos ? 'Install on iOS' : 'Install'}
          </button>

          <button
            type="button"
            className="iconbtn"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            style={{ color: 'var(--muted)', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Instructions Drawer */}
      {showIosInstructions && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setShowIosInstructions(false)}
        >
          <div
            style={{
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--line)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px',
              width: '100%',
              maxWidth: '480px',
              textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: 'var(--line)', borderRadius: '2px', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', margin: '0 0 8px' }}>Install on iPhone / iPad</h3>
            <p className="xs muted" style={{ marginBottom: '18px' }}>
              Follow these simple steps in Safari to add Recruitbyct to your Home Screen:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--yellow)', color: '#1A1400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>1</span>
                <span>Tap the <b>Share button</b> (<Share size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />) at the bottom of Safari.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--yellow)', color: '#1A1400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>2</span>
                <span>Scroll down and select <b>Add to Home Screen</b> (<PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--yellow)', color: '#1A1400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>3</span>
                <span>Tap <b>Add</b> in the top right corner. Recruit on the go!</span>
              </div>
            </div>

            <button
              type="button"
              className="btn primary block"
              onClick={() => setShowIosInstructions(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
