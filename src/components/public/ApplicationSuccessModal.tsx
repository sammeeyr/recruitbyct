import React from 'react';
import { useApp } from '../../context/AppContext';
import { Copy, X } from 'lucide-react';

export const ApplicationSuccessModal: React.FC = () => {
  const { modal, closeModal, jobs, showToast, setTrackState, navigate } = useApp();

  if (!modal || modal.type !== 'job' || modal.mode !== 'done') {
    return null;
  }

  const job = jobs.find(j => j.id === modal.id);
  const refCode = modal.ref || '';
  const contact = modal.contact || '';

  const copyRef = () => {
    try {
      navigator.clipboard.writeText(refCode);
      showToast('Reference number copied to clipboard.');
    } catch {
      showToast(`Reference: ${refCode}`);
    }
  };

  const handleTrackThis = () => {
    setTrackState({
      step: 1,
      ref: refCode,
      contact: contact,
      err: '',
      fails: 0,
      selId: null,
      code: '',
      valid: false
    });
    closeModal();
    navigate('track');
  };

  return (
    <>
      <button
        type="button"
        className="btn ghost sm close"
        onClick={closeModal}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      <p className="eyebrow" style={{ color: 'var(--good)' }}>
        Application received
      </p>
      <h2>You are in the queue</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>
        Applied for {job ? job.title : 'this role'}. Keep this reference number to track
        your status.
      </p>

      <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
        <p className="xs muted caps">Your reference</p>
        <p
          className="mono"
          style={{
            fontSize: '32px',
            fontWeight: 700,
            margin: '8px 0 16px',
            overflowWrap: 'anywhere'
          }}
        >
          {refCode}
        </p>
        <button type="button" className="btn ghost sm" onClick={copyRef}>
          <Copy size={14} /> Copy reference
        </button>
      </div>

      {modal.merged && (
        <div className="banner" style={{ marginTop: '14px' }}>
          We found your profile in our talent pool and added this application to it. No
          duplicate profile was created.
        </div>
      )}

      <p className="sm muted" style={{ margin: '14px 0' }}>
        In the live system this reference is also sent by email and WhatsApp.
      </p>

      <div className="row">
        <button type="button" className="btn primary" onClick={handleTrackThis}>
          Track this application
        </button>
        <button type="button" className="btn ghost" onClick={closeModal}>
          Back to roles
        </button>
      </div>
    </>
  );
};
