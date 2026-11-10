import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatNaira, prettyKey, getJobApplicationUrl } from '../../utils/helpers';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { Check, X, Edit2, UploadCloud, Share2, Users, Copy, Link2, ExternalLink } from 'lucide-react';
import { LinkedinIcon } from '../common/LinkedinIcon';

export const JobOrderModal: React.FC = () => {
  const {
    modal,
    closeModal,
    openModal,
    jobs,
    applications,
    clients,
    approveJobScorecard,
    updateJobListing,
    updateJobState,
    setPipeJobId,
    navigate,
    showToast
  } = useApp();

  if (!modal || modal.type !== 'jo') return null;

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);

  const handleOpenPipeline = () => {
    setPipeJobId(job.id);
    closeModal();
    navigate('pipeline');
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
        {client?.name}
      </p>

      <h2>{job.title}</h2>
      <p className="muted">
        {job.location} · {job.type} · {formatNaira(job.salary[0])} to{' '}
        {formatNaira(job.salary[1])} a month
      </p>

      {/* Shareable Job URL Box */}
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '10px 12px',
          margin: '12px 0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <span className="xs muted" style={{ display: 'block', marginBottom: '2px', fontWeight: 600 }}>
            Public Job Application URL
          </span>
          <span className="mono xs" style={{ color: 'var(--ink)', wordBreak: 'break-all' }}>
            {getJobApplicationUrl(job)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              const url = getJobApplicationUrl(job);
              navigator.clipboard.writeText(url);
              showToast('Job application link copied to clipboard!');
            }}
            style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Copy size={12} /> Copy Link
          </button>
          <a
            href={getJobApplicationUrl(job)}
            target="_blank"
            rel="noreferrer"
            className="btn ghost sm"
            style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ExternalLink size={12} /> Open
          </a>
        </div>
      </div>

      {!job.approved && (
        <div className="banner" style={{ margin: '14px 0' }}>
          <b>Drafted by AI.</b> Check each criterion. Nothing is published and no CV is
          scored against it until you approve.
        </div>
      )}

      <div className="row spread" style={{ alignItems: 'center', marginTop: '16px', marginBottom: '4px' }}>
        <h3 style={{ margin: 0 }}>Scorecard</h3>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => openModal({ type: 'editjob', id: job.id })}
          style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--red-text)' }}
          title="Edit scorecard criteria, must-haves, and helpful skills"
        >
          <Edit2 size={13} /> Edit Scorecard & Rubric
        </button>
      </div>
      <p className="sm muted">
        Must-haves share 60 points. Helpful skills add the points shown. Experience adds up
        to 10 points.
      </p>

      <ul className="crit">
        {job.must.map((x, idx) => (
          <li key={idx}>
            <span className="ok">
              <Check size={12} strokeWidth={3} />
            </span>
            <div>
              <b>{x.label}</b>
              <div className="muted sm">
                Must-have · looks for {x.keys.map(prettyKey).join(' or ')}
              </div>
            </div>
          </li>
        ))}

        {job.nice.map((x, idx) => (
          <li key={idx}>
            <span
              className="ok"
              style={{ background: 'var(--yellow-soft)', color: 'var(--yellow-text)' }}
            >
              +
            </span>
            <div>
              <b>{x.label}</b>
              <div className="muted sm">Helpful · {x.w || 10} points</div>
            </div>
          </li>
        ))}

        <li>
          <span className="ok" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
            #
          </span>
          <div>
            <b>{job.minYears}+ years of experience</b>
            <div className="muted sm">Up to 10 points based on CV tenure</div>
          </div>
        </li>
      </ul>

      {/* Full Job Description & Scope (Supports up to 10,000 words with formatting) */}
      <div style={{ margin: '18px 0', padding: '14px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)' }}>
        <div className="row spread" style={{ alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>Job Description & Scope</h3>
          <button
            type="button"
            className="linkbtn xs"
            onClick={() => openModal({ type: 'editjob', id: job.id })}
            style={{ color: 'var(--red-text)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit2 size={12} /> Edit Full Description
          </button>
        </div>
        <RichTextRenderer content={job.summary} />
      </div>

      <h3>Public listing</h3>
      <div className="field">
        <label className="check">
          <input
            type="checkbox"
            checked={job.listing.published}
            disabled={!job.approved}
            onChange={e => updateJobListing(job.id, { published: e.target.checked })}
          />
          <span>
            Published on the careers site{' '}
            {!job.approved && '(approve the scorecard first)'}
          </span>
        </label>
      </div>

      <div className="field">
        <label className="check">
          <input
            type="checkbox"
            checked={job.listing.confidential}
            onChange={e =>
              updateJobListing(job.id, { confidential: e.target.checked })
            }
          />
          <span>
            Hide client name (display "Confidential client ·{' '}
            {client?.industry || 'Corporate'}")
          </span>
        </label>
      </div>

      <div className="field">
        <label className="check">
          <input
            type="checkbox"
            checked={job.listing.showSalary}
            onChange={e =>
              updateJobListing(job.id, { showSalary: e.target.checked })
            }
          />
          <span>Show the pay range</span>
        </label>
      </div>

      <div className="row" style={{ marginTop: '22px', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => openModal({ type: 'share-linkedin', jobId: job.id })}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0A66C2', borderColor: 'rgba(10, 102, 194, 0.4)' }}
          title="Broadcast and share this job order to LinkedIn"
        >
          <LinkedinIcon size={14} style={{ color: '#0A66C2' }} /> Share to LinkedIn
        </button>

        <button
          type="button"
          className="btn ghost sm"
          onClick={() => openModal({ type: 'editjob', id: job.id })}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Edit2 size={13} /> Edit Role (AI Polish)
        </button>

        <button
          type="button"
          className="btn ghost sm"
          onClick={() => openModal({ type: 'resume-import', jobId: job.id })}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--yellow)' }}
        >
          <UploadCloud size={13} /> Screen Resumes
        </button>

        {job.approved ? (
          <>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => openModal({ type: 'applicants', jobId: job.id })}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Users size={14} /> Manage Applicants ({applications.filter(a => a.jobId === job.id).length})
            </button>

            <button
              type="button"
              className="btn ghost sm"
              onClick={handleOpenPipeline}
            >
              Open pipeline
            </button>

            {job.state === 'open' && (
              <>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => updateJobState(job.id, 'filled')}
                >
                  Mark as filled
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => updateJobState(job.id, 'closed')}
                >
                  Close role
                </button>
              </>
            )}

            {job.state !== 'open' && job.state !== 'draft' && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => updateJobState(job.id, 'open')}
              >
                Reopen
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={() => approveJobScorecard(job.id)}
          >
            Approve scorecard
          </button>
        )}
      </div>
    </>
  );
};
