import React from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';

export const GoogleFormModal: React.FC = () => {
  const { modal, closeModal, openModal, jobs, showToast } = useApp();

  if (!modal || modal.type !== 'job' || modal.mode !== 'gform') {
    return null;
  }

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

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

      <p className="eyebrow">Alternative way to apply</p>
      <h2>Apply with Google Forms</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>
        {job.title} · same role, same tracking. Use this if the website upload does not
        work for you.
      </p>

      <ol className="ul" style={{ fontSize: '15px' }}>
        <li>Open the form. Google asks you to sign in so it can accept your CV file.</li>
        <li>
          Upload your CV as <b>PDF or DOCX</b> (up to 10 MB) and answer the same quick
          questions.
        </li>
        <li>
          We pick up your answers within minutes, create your application, and email you a
          reference number.
        </li>
        <li>
          Use <b>Track my application</b> with that reference, exactly as if you applied
          on this site.
        </li>
      </ol>

      <div className="banner" style={{ margin: '16px 0' }}>
        <b>No Google account?</b> Go back and use the website form. It requires no sign-in.
      </div>

      <div className="row">
        <button
          type="button"
          className="btn primary"
          onClick={() =>
            showToast(
              'In the live system this opens the Google Form for this role in a new tab.'
            )
          }
        >
          Open the Google Form
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => openModal({ type: 'job', id: job.id, mode: 'apply' })}
        >
          Back to website form
        </button>
      </div>

      <p className="xs muted" style={{ marginTop: '14px' }}>
        Official Integration: Google Form submissions are captured by serverless webhooks, logged to Google Sheets, and synced to Drive automatically.
      </p>
    </>
  );
};
