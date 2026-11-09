import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { PublicFooter } from '../public/PublicFooter';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const RecruiterLoginView: React.FC = () => {
  const { navigate, showToast } = useApp();
  const { loginRecruiter } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your recruiter work email.');
      return;
    }

    setLoading(true);
    const result = await loginRecruiter(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      showToast(`Welcome back, ${result.recruiter?.name || 'Recruiter'}!`);
      navigate('dashboard');
    } else {
      setErrorMsg(result.error || 'Invalid recruiter credentials. Please verify your email.');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••');
    setLoading(true);
    setErrorMsg('');
    const result = await loginRecruiter(demoEmail, 'demo_pass');
    setLoading(false);

    if (result.success) {
      showToast(`Signed in as ${result.recruiter?.name || 'Recruiter'}`);
      navigate('dashboard');
    } else {
      setErrorMsg(result.error || 'Demo login failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navigation Header */}
      <header className="hdr gut" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate('careers')}
            >
              Public Careers
            </button>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => navigate('onboard')}
            >
              Join as Partner
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="gut" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBlock: '48px 64px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '36px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(245, 184, 0, 0.1)',
                color: 'var(--yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}
            >
              <Lock size={22} />
            </div>
            <h1 className="caps" style={{ fontSize: '28px', marginBottom: '6px' }}>
              Recruiter Sign In
            </h1>
            <p className="muted sm">
              Sign in with your verified recruiter partner email to manage talent pipelines and job listings.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                marginBottom: '18px',
                color: 'var(--red)',
                fontSize: '12px'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span>{errorMsg}</span>
                {errorMsg.includes('/onboard') && (
                  <div style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      className="linkbtn xs"
                      onClick={() => navigate('onboard')}
                      style={{ color: 'var(--red)', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Click here to start self-onboarding →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label htmlFor="rec-email" style={{ fontSize: '13px', fontWeight: 600 }}>
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)'
                  }}
                />
                <input
                  id="rec-email"
                  type="email"
                  required
                  placeholder="name@agency.com or folake@cubetechconsults.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="rec-pwd" style={{ fontSize: '13px', fontWeight: 600 }}>
                  Password / Access Token
                </label>
                <span className="xs muted">Default access token enabled</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)'
                  }}
                />
                <input
                  id="rec-pwd"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                />
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    padding: '2px'
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn primary block"
              disabled={loading}
              style={{
                marginTop: '6px',
                height: '44px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                'Authenticating with Neon...'
              ) : (
                <>
                  Sign In to ATS <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Recruiter Accounts */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--line)' }}>
            <span className="xs muted" style={{ display: 'block', marginBottom: '8px', textAlign: 'center' }}>
              Quick Demo Login:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => handleQuickDemoLogin('folake@cubetechconsults.com')}
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <UserCheck size={12} /> Folake (Senior Recruiter)
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => handleQuickDemoLogin('tunde@cubetechconsults.com')}
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <ShieldCheck size={12} /> Tunde (Agency Admin)
              </button>
            </div>
          </div>

          {/* Footer Navigation Links */}
          <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '12px' }} className="muted">
            <span>New recruiter? </span>
            <button
              type="button"
              className="linkbtn xs"
              onClick={() => navigate('onboard')}
              style={{ color: 'var(--red)', fontWeight: 600 }}
            >
              Register & Partner (/onboard)
            </button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
