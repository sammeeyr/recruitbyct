import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  daysDiff,
  evaluateCandidate,
  formatNaira,
  getScoreClass,
  STAGE_LABELS
} from '../../utils/helpers';
import { X } from 'lucide-react';

export const CandidateModal: React.FC = () => {
  const {
    modal,
    closeModal,
    openModal,
    candidates,
    jobs,
    clients,
    applications,
    addCandidateToPipeline
  } = useApp();

  if (!modal || modal.type !== 'cand') return null;

  const candidate = candidates.find(c => c.id === modal.id);
  if (!candidate) return null;

  const candidateApps = applications.filter(a => a.candId === candidate.id);

  const matchedJobs = jobs
    .filter(
      j =>
        (j.state === 'open' || j.state === 'draft') &&
        !candidateApps.some(a => a.jobId === j.id)
    )
    .map(j => ({
      job: j,
      score: evaluateCandidate(j, candidate).score
    }))
    .sort((a, b) => b.score - a.score);

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

      <h2>{candidate.name}</h2>
      <p className="muted">
        {candidate.headline} · {candidate.loc} · {candidate.years} years of experience
      </p>

      <div className="skills" style={{ margin: '14px 0' }}>
        {candidate.skills.map((s, idx) => (
          <span key={idx} className="chip">
            {s}
          </span>
        ))}
      </div>

      <dl className="kv">
        <dt>Email</dt>
        <dd>{candidate.email}</dd>

        <dt>Phone</dt>
        <dd>{candidate.phone}</dd>

        <dt>Expected pay</dt>
        <dd>{formatNaira(candidate.sal)} a month</dd>

        <dt>Last verified</dt>
        <dd>{-daysDiff(candidate.verified)} days ago</dd>
      </dl>

      <h3>Applications</h3>
      {candidateApps.length > 0 ? (
        <ul className="list">
          {candidateApps.map(a => {
            const j = jobs.find(x => x.id === a.jobId);
            return (
              <li key={a.id}>
                <div className="t">
                  <b>{j?.title}</b>
                  <span className="muted sm">{STAGE_LABELS[a.stage]}</span>
                </div>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => openModal({ type: 'app', id: a.id })}
                >
                  Open
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">None yet. This candidate is currently talent-pool only.</p>
      )}

      <h3>Best matches for open job orders</h3>
      {matchedJobs.length > 0 ? (
        <ul className="list">
          {matchedJobs.map(({ job: j, score }) => {
            const client = clients.find(c => c.id === j.clientId);
            const scoreClass = getScoreClass(score);

            return (
              <li key={j.id}>
                <div className="t">
                  <b>{j.title}</b>
                  <span className="muted sm">
                    {client?.name} ·{' '}
                    <span className={`score ${scoreClass}`}>{score} match</span>
                  </span>
                </div>
                {j.state === 'draft' ? (
                  <span className="chip">Draft</span>
                ) : (
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => addCandidateToPipeline(candidate.id, j.id)}
                  >
                    Add to pipeline
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">No other active roles available to match against.</p>
      )}
    </>
  );
};
