import React from 'react';
import { useApp } from '../../context/AppContext';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import {
  formatDate,
  NEXT_STEPS_GUIDE,
  PUBLIC_STAGES,
  relativeTime,
  STAGE_INDEX
} from '../../utils/helpers';
import { Check, X } from 'lucide-react';
import { Application } from '../../types';

export const TrackView: React.FC = () => {
  const {
    trackState,
    setTrackState,
    applications,
    jobs,
    clients,
    candidates,
    withdrawApplication,
    showToast
  } = useApp();

  const currentApp = applications.find(a => a.id === trackState.selId);
  const currentCandidate = currentApp
    ? candidates.find(c => c.id === currentApp.candId)
    : null;
  const otherApps = currentCandidate
    ? applications.filter(a => a.candId === currentCandidate.id && a.id !== currentApp?.id)
    : [];

  const getPublicStatus = (a: Application) => {
    if (a.stage === 'withdrawn') return 'Withdrawn';
    if (a.stage === 'rejected') return 'Not progressed';
    if (a.stage === 'placed') return 'Placed';
    const j = jobs.find(x => x.id === a.jobId);
    if (j && (j.state === 'filled' || j.state === 'closed')) return 'Job closed';
    return PUBLIC_STAGES[STAGE_INDEX[a.stage] ?? 0];
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = trackState.ref.trim().toUpperCase();
    const contact = trackState.contact.trim();

    if (trackState.fails >= 5) {
      setTrackState(prev => ({
        ...prev,
        err: 'Too many attempts. Try again in 15 minutes.'
      }));
      return;
    }

    const app = applications.find(x => x.ref.toUpperCase() === ref);
    const cand = app ? candidates.find(c => c.id === app.candId) : null;
    const cleanDigits = (s: string) => s.replace(/\D/g, '').slice(-10);

    const isValid =
      app &&
      cand &&
      (cand.email.toLowerCase() === contact.toLowerCase() ||
        (cleanDigits(contact).length >= 10 &&
          cleanDigits(contact) === cleanDigits(cand.phone)));

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    setTrackState(prev => ({
      ...prev,
      ref,
      contact,
      valid: !!isValid,
      selId: isValid ? app.id : null,
      err: '',
      code: generatedCode,
      step: 2
    }));
  };

  const handleStep2Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const enteredCode = (form.elements.namedItem('code') as HTMLInputElement)?.value.trim();

    if (trackState.fails >= 5) {
      setTrackState(prev => ({
        ...prev,
        err: 'Too many attempts. Try again in 15 minutes.'
      }));
      return;
    }

    if (!trackState.valid || enteredCode !== trackState.code) {
      setTrackState(prev => ({
        ...prev,
        fails: prev.fails + 1,
        err: "We couldn't confirm those details. Check the reference number, the email or phone you used, and the code."
      }));
      return;
    }

    setTrackState(prev => ({
      ...prev,
      err: '',
      step: 3
    }));
  };

  const fillDemo = () => {
    setTrackState(prev => ({
      ...prev,
      ref: 'CTC-7K4M-92QX',
      contact: 'ifeoma.chukwu@example.com',
      err: ''
    }));
  };

  const resetToStep1 = () => {
    setTrackState({
      step: 1,
      ref: '',
      contact: '',
      err: '',
      fails: 0,
      selId: null,
      code: '',
      valid: false
    });
  };

  const renderTimeline = (app: Application) => {
    const pubStatus = getPublicStatus(app);
    const isStop = ['Not progressed', 'Job closed', 'Withdrawn'].includes(pubStatus);
    const reachedIdx = isStop
      ? STAGE_INDEX[app.stage === 'rejected' || app.stage === 'withdrawn' ? app.prev || 'new' : app.stage] ?? 0
      : PUBLIC_STAGES.indexOf(pubStatus);

    return (
      <ol className="tl" aria-label="Application progress">
        {PUBLIC_STAGES.map((label, idx) => {
          const isDone = idx < reachedIdx || (idx === reachedIdx && isStop);
          const isNow = idx === reachedIdx && !isStop;
          const cls = isDone ? 'done' : isNow ? 'now' : '';

          return (
            <li key={label} className={cls}>
              <span className="n">{isDone ? <Check size={13} strokeWidth={3} /> : null}</span>
              {label}
            </li>
          );
        })}

        {isStop && (
          <li className="stop now">
            <span className="n">
              <X size={13} strokeWidth={3} />
            </span>
            {pubStatus}
          </li>
        )}
      </ol>
    );
  };

  const renderStatusCard = (app: Application) => {
    const job = jobs.find(j => j.id === app.jobId);
    const client = job ? clients.find(c => c.id === job.clientId) : null;
    const pubStatus = getPublicStatus(app);
    const isOpen = !['placed', 'rejected', 'withdrawn'].includes(app.stage);

    return (
      <div className="card">
        <p className="xs muted caps" style={{ letterSpacing: '.12em', fontWeight: 600 }}>
          {job?.listing.confidential ? 'Confidential client' : client?.name}
        </p>

        <h2 style={{ fontSize: '30px', textTransform: 'uppercase', margin: '4px 0 4px' }}>
          {job?.title}
        </h2>

        <p className="muted sm">
          Reference <span className="mono">{app.ref}</span> · Applied {formatDate(app.applied)} ·
          Last updated {relativeTime(app.updated)}
        </p>

        <div className="status-hero" style={{ marginTop: '16px' }}>
          <h2>{pubStatus}</h2>
        </div>

        <div className="banner" style={{ marginTop: '12px' }}>
          <b>What happens next.</b> {NEXT_STEPS_GUIDE[pubStatus]}
        </div>

        {renderTimeline(app)}

        <div className="row" style={{ marginTop: '10px', gap: '8px' }}>
          {isOpen && (
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => withdrawApplication(app.id)}
            >
              Withdraw application
            </button>
          )}

          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              showToast('Contact details form would open here in the live system.')
            }
          >
            Update my contact details
          </button>

          <button
            type="button"
            className="btn ghost sm"
            onClick={() =>
              showToast(
                'Deletion request logged. The live system removes the CV and any Drive copies.'
              )
            }
          >
            Request data deletion
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicHeader />

      <div className="gut" style={{ flex: 1 }}>
        <div className="track">
          {trackState.step === 1 && (
            <>
              <h2 className="caps" style={{ fontSize: '44px' }}>
                Track my application
              </h2>
              <p className="muted" style={{ margin: '8px 0 22px' }}>
                Enter the reference number you received when you applied. We confirm it is
                you with a one-time code before showing anything.
              </p>

              <form onSubmit={handleStep1Submit} className="card">
                <div className="field">
                  <label htmlFor="t-ref">Reference number</label>
                  <input
                    id="t-ref"
                    name="ref"
                    className="mono"
                    type="text"
                    placeholder="CTC-XXXX-XXXX"
                    autoComplete="off"
                    value={trackState.ref}
                    onChange={e =>
                      setTrackState(prev => ({ ...prev, ref: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="t-contact">Email or phone you applied with</label>
                  <input
                    id="t-contact"
                    name="contact"
                    type="text"
                    autoComplete="off"
                    value={trackState.contact}
                    onChange={e =>
                      setTrackState(prev => ({ ...prev, contact: e.target.value }))
                    }
                    placeholder="e.g. ifeoma.chukwu@example.com or 0803 555 0101"
                    required
                  />
                </div>

                {trackState.err && (
                  <div className="err" role="alert">
                    {trackState.err}
                  </div>
                )}

                <div className="row">
                  <button className="btn primary" type="submit">
                    Send my code
                  </button>
                  <button type="button" className="linkbtn" onClick={fillDemo}>
                    Fill in a demo application
                  </button>
                </div>
              </form>
            </>
          )}

          {trackState.step === 2 && (
            <>
              <h2 className="caps" style={{ fontSize: '44px' }}>
                Enter your code
              </h2>
              <p className="muted" style={{ margin: '8px 0 22px' }}>
                If these details match an application, we send a six-digit code to that
                email or phone. It expires in 10 minutes.
              </p>

              <form onSubmit={handleStep2Submit} className="card">
                <div className="demo-code sm">
                  <b>Prototype only.</b> Nothing is sent from this page. Your code is{' '}
                  <span className="mono" style={{ fontWeight: 700 }}>
                    {trackState.code}
                  </span>
                  .
                </div>

                <div className="field">
                  <label htmlFor="t-code">One-time code</label>
                  <input
                    id="t-code"
                    name="code"
                    className="mono"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    required
                  />
                </div>

                {trackState.err && (
                  <div className="err" role="alert">
                    {trackState.err}
                  </div>
                )}

                <div className="row">
                  <button className="btn primary" type="submit">
                    Show my status
                  </button>
                  <button type="button" className="linkbtn" onClick={resetToStep1}>
                    Use a different reference
                  </button>
                </div>
              </form>
            </>
          )}

          {trackState.step === 3 && currentApp && (
            <>
              <div className="row spread" style={{ marginBottom: '16px' }}>
                <h2 className="caps" style={{ fontSize: '44px' }}>
                  Your status
                </h2>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={resetToStep1}
                >
                  Look up another
                </button>
              </div>

              {renderStatusCard(currentApp)}

              {otherApps.length > 0 && (
                <>
                  <h3
                    className="caps"
                    style={{ fontSize: '24px', margin: '24px 0 10px' }}
                  >
                    Your other applications
                  </h3>
                  <ul className="list card">
                    {otherApps.map(app => {
                      const j = jobs.find(x => x.id === app.jobId);
                      return (
                        <li key={app.id}>
                          <div className="t">
                            <b>{j?.title}</b>
                            <span className="muted sm mono">{app.ref}</span>
                          </div>
                          <span className="chip">{getPublicStatus(app)}</span>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() =>
                              setTrackState(prev => ({ ...prev, selId: app.id }))
                            }
                          >
                            View
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
