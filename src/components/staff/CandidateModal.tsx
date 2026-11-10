import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  daysDiff,
  evaluateCandidate,
  formatNaira,
  getScoreClass,
  STAGE_LABELS
} from '../../utils/helpers';
import { X, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { SUPPORTED_20_PLATFORMS } from '../../utils/candidateEnrichmentHelper';

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

      {/* Profile Header with Avatar & AI Enrichment Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        {candidate.avatarUrl ? (
          <img
            src={candidate.avatarUrl}
            alt={candidate.name}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #A855F7',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.25)'
            }}
          />
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--red)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800
            }}
          >
            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '22px' }}>{candidate.name}</h2>
            <button
              type="button"
              className="btn sm"
              onClick={() => openModal({ type: 'candidate-enrichment', id: candidate.id })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                color: '#fff',
                fontSize: '12px',
                padding: '6px 12px',
                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
              }}
            >
              <Sparkles size={14} />
              <span>Enrich with AI Engine</span>
            </button>
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            {candidate.headline} · {candidate.loc} · {candidate.years} years of experience
          </p>
        </div>
      </div>

      {/* Discovered Social & Public Platforms (20+ Platforms Support) */}
      {candidate.socialLinks && Object.keys(candidate.socialLinks).length > 0 && (
        <div
          style={{
            margin: '14px 0',
            padding: '12px 14px',
            background: 'var(--bg)',
            borderRadius: '10px',
            border: '1px solid var(--line)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="xs muted caps" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Globe size={13} style={{ color: '#A855F7' }} />
              Discovered Social & Public Profiles ({Object.keys(candidate.socialLinks).length})
            </span>
            <span className="xs" style={{ color: '#A855F7', fontWeight: 600 }}>
              AI Verified
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(candidate.socialLinks).map(([platId, url]) => {
              const platform = SUPPORTED_20_PLATFORMS.find(p => p.id === platId);
              return (
                <a
                  key={platId}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: platform?.badgeBg || 'rgba(168, 85, 247, 0.12)',
                    color: platform?.color || '#A855F7',
                    border: `1px solid ${platform?.color || '#A855F7'}40`,
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                  title={`Open ${platform?.name || platId} Profile`}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: platform?.color || '#A855F7' }} />
                  <span>{platform?.name || platId}</span>
                  <ExternalLink size={10} />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Beyond Resume */}
      {candidate.publicInsights && candidate.publicInsights.length > 0 && (
        <div
          style={{
            margin: '14px 0',
            padding: '12px 14px',
            background: 'var(--bg)',
            borderRadius: '10px',
            border: '1px solid var(--line)'
          }}
        >
          <span className="xs caps" style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: 'var(--yellow)' }}>
            Insights Beyond Resume
          </span>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {candidate.publicInsights.map((insight, idx) => (
              <li key={idx} style={{ fontSize: '12px', lineHeight: 1.4, color: 'var(--ink)' }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

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
