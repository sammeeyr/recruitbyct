import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { firstName } from '../../utils/helpers';
import { X } from 'lucide-react';

export const RejectMessageModal: React.FC = () => {
  const {
    modal,
    closeModal,
    applications,
    jobs,
    candidates,
    sendRejectMessage,
    keepApplicationInPipeline
  } = useApp();

  if (!modal || modal.type !== 'reject') return null;

  const app = applications.find(a => a.id === modal.id);
  if (!app) return null;

  const candidate = candidates.find(c => c.id === app.candId);
  const job = jobs.find(j => j.id === app.jobId);

  const initialMsg = `Hi ${
    candidate ? firstName(candidate.name) : 'there'
  }, thank you for applying for ${
    job ? job.title : 'this role'
  }. After careful review we will not take your application further for this role. We have kept your profile in our talent pool for similar upcoming roles.`;

  const [message, setMessage] = useState(initialMsg);

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

      <h2>Not progressing: {candidate?.name}</h2>
      <p className="muted" style={{ marginBottom: '14px' }}>
        {job?.title}. The applicant sees "Not progressed" only after you review and approve.
        {app.rejectPending && app.rejectPending.src === 'client' && (
          <span>
            {' '}
            Client reason: <b>{app.rejectPending.reason}</b>.
          </span>
        )}
      </p>

      <div className="field">
        <label htmlFor="rj-msg">Message to the applicant</label>
        <textarea
          id="rj-msg"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ minHeight: '140px' }}
        />
      </div>

      <div className="row" style={{ gap: '8px' }}>
        <button
          type="button"
          className="btn primary"
          onClick={() => sendRejectMessage(app.id)}
        >
          Approve and send
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => keepApplicationInPipeline(app.id)}
        >
          Keep in pipeline
        </button>
      </div>
    </>
  );
};
