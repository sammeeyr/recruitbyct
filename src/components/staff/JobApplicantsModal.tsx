import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScoreRing } from '../common/ScoreRing';
import { LinkedinIcon } from '../common/LinkedinIcon';
import { KNOCKOUT_QUESTIONS } from '../../data/mockData';
import {
  evaluateCandidate,
  formatDate,
  formatNaira,
  prettyKey,
  getJobSlug,
  getJobApplicationUrl,
  STAGES
} from '../../utils/helpers';
import { Stage } from '../../types';
import {
  X,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  UserCheck,
  UploadCloud,
  ChevronRight
} from 'lucide-react';

export const JobApplicantsModal: React.FC = () => {
  const {
    modal,
    closeModal,
    openModal,
    jobs,
    applications,
    candidates,
    clients,
    moveApplication,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'top-match' | Stage | 'rejected'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!modal || modal.type !== 'applicants') return null;

  const job = jobs.find(j => j.id === modal.jobId || j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);
  const jobApps = applications.filter(a => a.jobId === job.id);

  // Evaluate and enrich each applicant
  const enrichedApps = jobApps.map(app => {
    const candidate = candidates.find(c => c.id === app.candId) || {
      id: app.candId,
      name: 'Applicant',
      headline: 'Candidate',
      loc: 'Abuja',
      years: 0,
      skills: [],
      sal: 0,
      avail: 0,
      verified: '2026-11-09',
      drive: 'queued' as const,
      email: '',
      phone: ''
    };

    const evaluation = evaluateCandidate(
      job,
      candidate,
      app.answers,
      KNOCKOUT_QUESTIONS
    );

    return {
      app,
      candidate,
      evaluation
    };
  });

  // Filter applicants
  const filteredApps = enrichedApps.filter(({ app, candidate, evaluation }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      candidate.name.toLowerCase().includes(q) ||
      candidate.email.toLowerCase().includes(q) ||
      candidate.headline.toLowerCase().includes(q) ||
      candidate.skills.some(s => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (stageFilter === 'all') return true;
    if (stageFilter === 'top-match') return evaluation.score >= 80;
    if (stageFilter === 'rejected') return app.stage === 'rejected';
    return app.stage === stageFilter;
  });

  // Sort by match score descending by default
  filteredApps.sort((a, b) => b.evaluation.score - a.evaluation.score);

  const applyUrl = getJobApplicationUrl(job);

  const handleCopyApplyUrl = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopiedLink(true);
    showToast('Job application URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div>
          <span className="xs caps" style={{ letterSpacing: '.1em', color: 'var(--red-text)', fontWeight: 600 }}>
            {client?.name || 'Cube Tech Consults'} · Applicants Management
          </span>
          <h2 style={{ margin: '4px 0 2px', fontSize: '20px' }}>{job.title}</h2>
          <div className="xs muted">
            {jobApps.length} Total Applicants · {job.location} ({job.type}) · {formatNaira(job.salary[0])} - {formatNaira(job.salary[1])}
          </div>
        </div>

        {/* Action Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleCopyApplyUrl}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Copy shareable applicant link"
          >
            {copiedLink ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
            {copiedLink ? 'Copied Link!' : 'Copy Job Apply URL'}
          </button>

          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openModal({ type: 'share-linkedin', jobId: job.id })}
            style={{ fontSize: '12px', color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '5px', borderColor: 'rgba(10, 102, 194, 0.4)' }}
          >
            <LinkedinIcon size={13} style={{ color: '#0A66C2' }} /> Share on LinkedIn
          </button>

          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openModal({ type: 'resume-import', jobId: job.id })}
            style={{ fontSize: '12px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <UploadCloud size={13} /> Batch Screen Resumes
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search applicants by name, skill, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '13px', width: '100%', margin: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { key: 'all', label: `All (${jobApps.length})` },
            { key: 'top-match', label: `Top Matches (≥80%)` },
            { key: 'new', label: 'New' },
            { key: 'screening', label: 'Screening' },
            { key: 'shortlisted', label: 'Shortlisted' },
            { key: 'interview', label: 'Interview' },
            { key: 'rejected', label: 'Not Progressed' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`pill ${stageFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStageFilter(tab.key as any)}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                background: stageFilter === tab.key ? 'var(--yellow)' : 'transparent',
                color: stageFilter === tab.key ? '#1A1400' : 'var(--ink)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List */}
      {filteredApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-2)', borderRadius: '8px' }}>
          <p className="muted" style={{ margin: 0 }}>
            No applicants found matching this criteria. Share the job link to attract more candidates!
          </p>
          <button
            type="button"
            className="btn primary sm"
            onClick={handleCopyApplyUrl}
            style={{ marginTop: '12px' }}
          >
            Copy Job Application Link
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredApps.map(({ app, candidate, evaluation }) => {
            const isTopMatch = evaluation.score >= 80;
            const isFromLinkedIn = app.source === 'LinkedIn' || Boolean(candidate.linkedinUrl || app.linkedinUrl);

            return (
              <div
                key={app.id}
                style={{
                  background: 'var(--surface)',
                  border: isTopMatch ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                  transition: 'box-shadow 0.15s ease'
                }}
              >
                {/* Left: Avatar + Candidate details */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: isTopMatch ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-2)',
                        border: `2px solid ${isTopMatch ? '#10B981' : 'var(--line)'}`,
                        color: 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '15px'
                      }}
                    >
                      {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <b
                        style={{ fontSize: '15px', cursor: 'pointer', color: 'var(--ink)' }}
                        onClick={() => openModal({ type: 'app', id: app.id })}
                      >
                        {candidate.name}
                      </b>

                      {isFromLinkedIn && (
                        <span
                          className="chip"
                          style={{
                            fontSize: '11px',
                            background: 'rgba(10, 102, 194, 0.12)',
                            color: '#0A66C2',
                            borderColor: 'rgba(10, 102, 194, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '1px 6px'
                          }}
                        >
                          <LinkedinIcon size={11} /> LinkedIn
                        </span>
                      )}

                      {isTopMatch && (
                        <span className="chip good" style={{ fontSize: '11px', padding: '1px 6px' }}>
                          Top Match
                        </span>
                      )}

                      {app.aiInterview?.status === 'completed' && (
                        <span className="chip good" style={{ fontSize: '11px', padding: '1px 6px' }}>
                          AI Interview {app.aiInterview.overallScore}%
                        </span>
                      )}
                    </div>

                    <div className="xs muted" style={{ marginTop: '2px' }}>
                      {candidate.headline} · {candidate.loc} · {candidate.years} years exp · Applied {formatDate(app.applied)}
                    </div>

                    {/* Matched skills badges */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {candidate.skills.slice(0, 4).map((sk, i) => {
                        const isJobRequirement = [...job.must, ...job.nice].some(m =>
                          m.keys.some(k => sk.toLowerCase().includes(k.toLowerCase()))
                        );
                        return (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isJobRequirement ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-2)',
                              color: isJobRequirement ? '#10B981' : 'var(--ink)',
                              border: `1px solid ${isJobRequirement ? 'rgba(16, 185, 129, 0.25)' : 'var(--line)'}`
                            }}
                          >
                            {sk}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Score Ring + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <ScoreRing score={evaluation.score} />
                    <div className="xs muted" style={{ marginTop: '2px', fontWeight: 600 }}>
                      {evaluation.score}%
                    </div>
                  </div>

                  {/* Stage Dropdown */}
                  <div style={{ minWidth: '130px' }}>
                    <label className="sr" htmlFor={`st-${app.id}`}>Stage</label>
                    <select
                      id={`st-${app.id}`}
                      value={app.stage}
                      onChange={e => {
                        const target = e.target.value as Stage;
                        if (target === 'rejected') {
                          openModal({ type: 'reject', id: app.id });
                        } else {
                          moveApplication(app.id, target);
                          showToast(`Moved ${candidate.name} to ${target}`);
                        }
                      }}
                      style={{
                        fontSize: '12px',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'var(--surface-2)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line)',
                        width: '100%'
                      }}
                    >
                      {STAGES.map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                      <option value="rejected">Not progressed</option>
                    </select>
                  </div>

                  {/* Quick Action Button */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => openModal({ type: 'app', id: app.id })}
                      style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="View full candidate profile & AI scorecard"
                    >
                      <FileText size={12} /> Review
                    </button>

                    {app.aiInterview?.status !== 'completed' && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => openModal({ type: 'ai-interview-invite', id: app.id })}
                        style={{ fontSize: '12px', padding: '5px 10px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Invite candidate to complete AI interview screening"
                      >
                        <Sparkles size={12} /> AI Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
