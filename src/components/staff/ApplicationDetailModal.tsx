import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScoreRing } from '../common/ScoreRing';
import { KNOCKOUT_QUESTIONS } from '../../data/mockData';
import {
  evaluateCandidate,
  formatDate,
  formatNaira,
  PUBLIC_STAGES,
  STAGES,
  STAGE_INDEX,
  STAGE_LABELS
} from '../../utils/helpers';
import { Check, X, FileText } from 'lucide-react';
import { Stage } from '../../types';

export const ApplicationDetailModal: React.FC = () => {
  const {
    modal,
    closeModal,
    openModal,
    applications,
    jobs,
    candidates,
    clients,
    moveApplication,
    updateApplicationNotes,
    showToast
  } = useApp();

  if (!modal || modal.type !== 'app') return null;

  const app = applications.find(a => a.id === modal.id);
  if (!app) return null;

  const candidate = candidates.find(c => c.id === app.candId);
  const job = jobs.find(j => j.id === app.jobId);
  const client = job ? clients.find(c => c.id === job.clientId) : null;

  if (!candidate || !job) return null;

  const evaluation = evaluateCandidate(
    job,
    candidate,
    app.answers,
    KNOCKOUT_QUESTIONS
  );

  const nextStageStep: Record<string, [Stage, string]> = {
    new: ['screening', 'Start screening'],
    screening: ['shortlisted', 'Shortlist'],
    shortlisted: ['submitted', 'Submit to client'],
    submitted: ['interview', 'Client requested interview'],
    interview: ['offer', 'Move to offer'],
    offer: ['placed', 'Mark as placed']
  };

  const advanceTarget = nextStageStep[app.stage];

  const getPublicStatus = () => {
    if (app.stage === 'withdrawn') return 'Withdrawn';
    if (app.stage === 'rejected') return 'Not progressed';
    if (app.stage === 'placed') return 'Placed';
    if (job.state === 'filled' || job.state === 'closed') return 'Job closed';
    return PUBLIC_STAGES[STAGE_INDEX[app.stage] ?? 0];
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

      <p
        className="xs caps"
        style={{ letterSpacing: '.12em', fontWeight: 600, color: 'var(--red-text)' }}
      >
        {job.title} · {client?.name}
      </p>

      <h2>{candidate.name}</h2>
      <p className="muted">
        {candidate.headline} · {candidate.loc} · {candidate.years} years of experience
      </p>

      <div className="row" style={{ margin: '16px 0', gap: '14px' }}>
        <ScoreRing score={evaluation.score} />
        <div>
          <b style={{ fontSize: '18px' }}>{evaluation.score} of 100</b>
          <div className="muted sm">
            AI pre-screen match score. Your recruiter judgment outranks it.
          </div>
        </div>
      </div>

      {app.rejectPending && (
        <div className="banner red" style={{ marginBottom: '14px' }}>
          <b>Not-progressing message waiting.</b>{' '}
          {app.rejectPending.src === 'client' && (
            <span>Client feedback: {app.rejectPending.reason}. </span>
          )}
          <button
            type="button"
            className="linkbtn"
            onClick={() => openModal({ type: 'reject', id: app.id })}
          >
            Review message
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor="stage-select">Current Stage</label>
        <select
          id="stage-select"
          value={app.stage}
          onChange={e => {
            const v = e.target.value;
            if (v === 'rejected') {
              openModal({ type: 'reject', id: app.id });
              return;
            }
            moveApplication(app.id, v as Stage);
          }}
        >
          {STAGES.map(([stKey, stLabel]) => (
            <option key={stKey} value={stKey}>
              {stLabel}
            </option>
          ))}
          <option value="rejected">Not progressed</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <div className="row" style={{ gap: '8px' }}>
        {advanceTarget && (
          <button
            type="button"
            className="btn primary"
            onClick={() => moveApplication(app.id, advanceTarget[0])}
          >
            {advanceTarget[1]}
          </button>
        )}

        {!['rejected', 'withdrawn', 'placed'].includes(app.stage) && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => openModal({ type: 'reject', id: app.id })}
          >
            Not progressing…
          </button>
        )}
      </div>

      <h3>Why this score</h3>
      <ul className="crit">
        {evaluation.crit.map((x, idx) => (
          <li key={idx}>
            <span className={x.met ? 'ok' : 'no'}>
              {x.met ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
            </span>
            <div>
              <b>{x.label}</b>
              <div className="muted sm">{x.ev}</div>
            </div>
          </li>
        ))}
      </ul>

      <h3>Candidate Profile</h3>
      <dl className="kv">
        <dt>Email</dt>
        <dd>{candidate.email}</dd>

        <dt>Phone</dt>
        <dd>{candidate.phone}</dd>

        <dt>Expected pay</dt>
        <dd>{formatNaira(candidate.sal)} a month</dd>

        <dt>Available</dt>
        <dd>{candidate.avail ? `In ${candidate.avail} days` : 'Immediately'}</dd>

        <dt>Source</dt>
        <dd>{app.source}</dd>

        <dt>Reference</dt>
        <dd className="mono">{app.ref}</dd>

        <dt>Applied</dt>
        <dd>{formatDate(app.applied)}</dd>

        <dt>Public status</dt>
        <dd>{getPublicStatus()}</dd>
      </dl>

      <h3>CV and Drive</h3>
      <div className="filebox">
        <FileText size={20} className="muted" />
        <div className="grow">
          <b className="mono xs">{app.file}</b>
          <div className="muted xs">
            Master copy in Cube Tech storage · Drive copy{' '}
            {candidate.drive === 'synced' ? 'synced' : 'queued'}
          </div>
        </div>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() =>
            showToast('Opens the file in Google Drive in the live connected workspace.')
          }
        >
          Open in Drive
        </button>
      </div>

      <h3>Recruiter private notes</h3>
      <textarea
        value={app.notes}
        onChange={e => updateApplicationNotes(app.id, e.target.value)}
        placeholder="Private notes visible only to recruiters and admins"
        style={{ minHeight: '90px' }}
      />
    </>
  );
};
