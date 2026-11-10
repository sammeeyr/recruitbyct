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
  ChevronRight,
  Bot,
  Award,
  Users,
  RefreshCw,
  TrendingUp,
  ArrowRight
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
    inviteCandidateToAiInterview,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'ai-comparison'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'top-match' | Stage | 'rejected'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [batchInviting, setBatchInviting] = useState(false);

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

  // Interviewed applicants for comparison matrix
  const interviewedApps = enrichedApps.filter(
    e => e.app.aiInterview?.status === 'completed'
  );
  interviewedApps.sort(
    (a, b) => (b.app.aiInterview?.overallScore || 0) - (a.app.aiInterview?.overallScore || 0)
  );

  const uninvitedApps = enrichedApps.filter(
    e => !e.app.aiInterview || e.app.aiInterview.status === 'invited'
  );

  const applyUrl = getJobApplicationUrl(job);

  const handleCopyApplyUrl = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopiedLink(true);
    showToast('Job application URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Batch invite applicants to AI Interview
  const handleBatchInvite = async (onlyTopMatches = false) => {
    const targets = enrichedApps.filter(e => {
      const isNotDone = e.app.aiInterview?.status !== 'completed';
      if (!isNotDone) return false;
      if (onlyTopMatches) return e.evaluation.score >= 70;
      return true;
    });

    if (targets.length === 0) {
      showToast('All matching candidates have already completed or been invited.');
      return;
    }

    setBatchInviting(true);
    let count = 0;
    for (const target of targets) {
      try {
        await inviteCandidateToAiInterview(target.app.id);
        count++;
      } catch (err) {
        console.warn('Invite error for app:', target.app.id, err);
      }
    }
    setBatchInviting(false);
    showToast(`Dispatched 24/7 AI Interview invitations to ${count} candidate(s)!`);
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
            {client?.name || 'Cube Tech Consults'} · Applicants & AI Screening
          </span>
          <h2 style={{ margin: '4px 0 2px', fontSize: '20px' }}>{job.title}</h2>
          <div className="xs muted">
            {jobApps.length} Total Applicants · {interviewedApps.length} AI Interviewed · {job.location} ({job.type}) · {formatNaira(job.salary[0])} - {formatNaira(job.salary[1])}
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

      {/* Primary Sub-view Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '8px' }}>
        <button
          type="button"
          className={`btn sm ${activeTab === 'all' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('all')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={14} /> All Applicants ({jobApps.length})
        </button>

        <button
          type="button"
          className={`btn sm ${activeTab === 'ai-comparison' ? 'primary' : 'ghost'}`}
          onClick={() => setActiveTab('ai-comparison')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Award size={14} /> AI Interview Assessments & Comparison ({interviewedApps.length})
        </button>
      </div>

      {/* ================= TAB 1: ALL APPLICANTS & BATCH SCREENING ================= */}
      {activeTab === 'all' && (
        <>
          {/* Batch AI Interview Scale Screening Action Card */}
          <div
            style={{
              background: 'rgba(255, 204, 0, 0.08)',
              border: '1px solid rgba(255, 204, 0, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--yellow)',
                  color: '#1A1400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <b style={{ fontSize: '13px', color: 'var(--yellow-text, #fef08a)' }}>
                  Scale Screening: Automated 24/7 AI Interviewer
                </b>
                <p className="xs muted" style={{ margin: 0 }}>
                  Interview unlimited candidates at once. The intelligent agent screens candidates against role criteria around the clock.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn primary sm"
                disabled={batchInviting || uninvitedApps.length === 0}
                onClick={() => handleBatchInvite(false)}
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {batchInviting ? <RefreshCw size={13} className="spin" /> : <Bot size={13} />}
                {batchInviting ? 'Sending Invites...' : `Batch Invite All Candidates (${uninvitedApps.length})`}
              </button>

              <button
                type="button"
                className="btn ghost sm"
                disabled={batchInviting}
                onClick={() => handleBatchInvite(true)}
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Sparkles size={13} /> Invite Top Matches (≥70%)
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search applicants by name, skill, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', fontSize: '12px' }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `All (${jobApps.length})` },
                { key: 'top-match', label: `Top Matches (${enrichedApps.filter(e => e.evaluation.score >= 80).length})` },
                { key: 'new', label: 'New' },
                { key: 'screening', label: 'Screening' },
                { key: 'shortlisted', label: 'Shortlisted' },
                { key: 'interview', label: 'Interview' },
                { key: 'submitted', label: 'Client Review' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setStageFilter(tab.key as any)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
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

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="linkbtn"
                            onClick={() => openModal({ type: 'cand', id: candidate.id })}
                            style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', textAlign: 'left', padding: 0 }}
                          >
                            {candidate.name}
                          </button>

                          {/* LinkedIn Badge */}
                          {isFromLinkedIn && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(10, 102, 194, 0.12)',
                                color: '#0A66C2',
                                border: '1px solid rgba(10, 102, 194, 0.25)'
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
                            <button
                              type="button"
                              onClick={() => openModal({ type: 'ai-interview-result', id: app.id })}
                              className="chip good"
                              style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Click to view AI Interview Scorecard & Transcripts"
                            >
                              <Sparkles size={11} /> AI Score {app.aiInterview.overallScore}% · View Report
                            </button>
                          )}

                          {app.aiInterview?.status === 'invited' && (
                            <span className="chip warn" style={{ fontSize: '11px', padding: '1px 6px' }}>
                              <Clock size={11} /> AI Interview Invited
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

                    {/* Middle: AI Match Ring & Knockout Checks */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <ScoreRing score={evaluation.score} />
                        <span className="xs muted" style={{ display: 'block', marginTop: '2px', fontSize: '10px' }}>
                          Match Score
                        </span>
                      </div>

                      <div className="xs muted" style={{ fontSize: '11px', borderLeft: '1px solid var(--line)', paddingLeft: '10px' }}>
                        <div><b>{evaluation.must}</b> of {job.must.length} must-haves</div>
                        <div style={{ color: evaluation.ko ? 'var(--good)' : 'var(--bad)' }}>
                          {evaluation.ko ? '✓ Knockouts passed' : '✗ Knockouts flagged'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Stage Dropdown */}
                      <select
                        value={app.stage}
                        onChange={e => {
                          const nextStage = e.target.value as Stage;
                          moveApplication(app.id, nextStage);
                          showToast(`Moved ${candidate.name} to ${nextStage}`);
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--line)',
                          background: 'var(--surface-2)'
                        }}
                      >
                        {STAGES.map(([stg, lbl]) => (
                          <option key={stg} value={stg}>
                            {lbl}
                          </option>
                        ))}
                      </select>

                      {/* Review CV */}
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => openModal({ type: 'app', id: app.id })}
                        style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="View Application Details & Resume"
                      >
                        <FileText size={12} /> Details
                      </button>

                      {/* Screen with AI Interview button */}
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
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: AI INTERVIEW ASSESSMENTS COMPARISON ================= */}
      {activeTab === 'ai-comparison' && (
        <div>
          {interviewedApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-2)', borderRadius: '8px' }}>
              <Bot size={36} className="muted" style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>No AI Interviews Completed Yet</h3>
              <p className="xs muted" style={{ maxWidth: '440px', margin: '0 auto 16px' }}>
                Scale your screening by inviting candidates to complete automated 24/7 AI interviews. Their evaluations and transcripts will appear here for side-by-side comparison.
              </p>
              <button
                type="button"
                className="btn primary sm"
                disabled={batchInviting}
                onClick={() => handleBatchInvite(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} /> Batch Invite All Candidates to AI Interview
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="xs muted">
                  Comparing <b>{interviewedApps.length}</b> candidates evaluated by Recruitbyct's AI Interviewer
                </span>
                <span className="xs muted font-mono">Standardized 24/7 Screening</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--line)', color: 'var(--muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Rank & Candidate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>AI Score</th>
                      <th style={{ padding: '8px 10px' }}>Recommendation</th>
                      <th style={{ padding: '8px 10px' }}>Experience</th>
                      <th style={{ padding: '8px 10px' }}>Expected Pay</th>
                      <th style={{ padding: '8px 10px' }}>Status / Stage</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewedApps.map(({ app, candidate }, idx) => {
                      const interview = app.aiInterview!;
                      const overallScore = interview.overallScore || 80;
                      const rec = interview.recommendation || 'Advance';
                      const recColor =
                        rec === 'Strong Hire' ? '#10B981' : rec === 'Advance' ? '#F59E0B' : '#EF4444';

                      return (
                        <tr
                          key={app.id}
                          style={{
                            borderBottom: '1px solid var(--line)',
                            background: idx === 0 ? 'rgba(16, 185, 129, 0.04)' : undefined
                          }}
                        >
                          {/* Candidate info */}
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: idx === 0 ? '#10B981' : 'var(--surface-2)',
                                  color: idx === 0 ? '#fff' : 'var(--muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '11px'
                                }}
                              >
                                #{idx + 1}
                              </span>
                              <div>
                                <b style={{ fontSize: '13px', display: 'block' }}>{candidate.name}</b>
                                <span className="xs muted">{candidate.headline} · {candidate.loc}</span>
                              </div>
                            </div>
                          </td>

                          {/* AI Score */}
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '16px',
                                fontWeight: 800,
                                color: recColor,
                                background: `${recColor}15`,
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              {overallScore}%
                            </span>
                          </td>

                          {/* Recommendation */}
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: recColor,
                                background: `${recColor}15`,
                                border: `1px solid ${recColor}30`,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}
                            >
                              {rec}
                            </span>
                          </td>

                          {/* Experience */}
                          <td style={{ padding: '12px 10px' }}>
                            <span>{candidate.years} years</span>
                          </td>

                          {/* Salary */}
                          <td style={{ padding: '12px 10px' }}>
                            <span>{candidate.sal ? formatNaira(candidate.sal) + '/mo' : 'Flexible'}</span>
                          </td>

                          {/* Current stage */}
                          <td style={{ padding: '12px 10px' }}>
                            <span className="badge sm" style={{ textTransform: 'capitalize' }}>
                              {app.stage}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn sm ghost"
                                onClick={() => openModal({ type: 'ai-interview-result', id: app.id })}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                Full Report
                              </button>

                              {app.stage !== 'submitted' && (
                                <button
                                  type="button"
                                  className="btn sm primary"
                                  onClick={() => {
                                    moveApplication(app.id, 'submitted');
                                    showToast(`${candidate.name} advanced to Client Shortlist.`);
                                  }}
                                  style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  Shortlist <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
