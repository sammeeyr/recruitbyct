import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { TriStripe } from '../common/TriStripe';
import { StatusChip } from '../common/StatusChip';
import { PublicFooter } from '../public/PublicFooter';
import {
  evaluateCandidate,
  getJobStatus,
  getScoreClass,
  STAGE_LABELS
} from '../../utils/helpers';
import { Application } from '../../types';
import { Lock, Sun, Moon, ArrowLeft, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { KNOCKOUT_QUESTIONS } from '../../data/mockData';
import { RichTextRenderer } from '../common/RichTextRenderer';

export const ClientPortalView: React.FC = () => {
  const {
    clients,
    jobs,
    applications,
    candidates,
    selectedClientId,
    setSelectedClientId,
    clientInterviewRequest,
    clientToggleHold,
    clientPass,
    clientMakeOffer,
    clientApproveOffer,
    navigate,
    theme,
    toggleTheme
  } = useApp();

  const [activeRejectAppId, setActiveRejectAppId] = useState<string | null>(null);
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  const toggleJobExpanded = (jobId: string) => {
    setExpandedJobIds(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const client = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientJobs = jobs.filter(j => j.clientId === client.id && j.state !== 'draft');

  const PASS_REASONS = [
    'Not enough experience',
    'Salary expectation too high',
    'Not the right culture fit',
    'Role no longer open'
  ];

  const getAnonId = (a: Application) => {
    const num = 100 + ((parseInt(a.id.slice(1)) || 1) * 37) % 900;
    return `Candidate A-${num}`;
  };

  const renderCandidateCard = (app: Application) => {
    const cand = candidates.find(c => c.id === app.candId);
    const job = jobs.find(j => j.id === app.jobId);
    if (!cand || !job) return null;

    const evaluation = evaluateCandidate(job, cand, app.answers, KNOCKOUT_QUESTIONS);
    const scoreClass = getScoreClass(evaluation.score);
    const isRevealed = app.revealed;
    const isRejecting = activeRejectAppId === app.id;

    const candidateNote = `Meets ${evaluation.must} of ${
      job.must.length
    } must-haves. ${cand.years} years of experience. Based in ${cand.loc}. ${
      cand.avail ? `Available in ${cand.avail} days.` : 'Available immediately.'
    }`;

    return (
      <article key={app.id} className="card">
        <div className="row spread">
          <div>
            <h3 style={{ fontSize: '26px' }}>
              {isRevealed ? cand.name : getAnonId(app)}
            </h3>
            <p className="muted">
              {cand.headline} · {cand.loc}
            </p>
          </div>

          <div className="row" style={{ gap: '8px' }}>
            <span className={`score ${scoreClass}`}>{evaluation.score} match</span>
            <span
              className={`chip ${
                app.stage === 'submitted' ? '' : 'good'
              }`}
            >
              {STAGE_LABELS[app.stage]}
            </span>
            {app.hold && <span className="chip warn">On hold</span>}
          </div>
        </div>

        <p style={{ margin: '12px 0' }}>{candidateNote}</p>

        {app.aiInterview?.status === 'completed' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 204, 0, 0.08)',
              border: '1px solid rgba(255, 204, 0, 0.25)',
              margin: '12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div className="row spread" style={{ alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: 'var(--yellow-text, #fef08a)'
                }}
              >
                <Sparkles size={14} /> AI Interview Screened: {app.aiInterview.overallScore}% ({app.aiInterview.recommendation})
              </span>
              <span className="xs muted">Automated Technical & Behavioral Pre-Screen</span>
            </div>
            {app.aiInterview.summary && (
              <p className="xs muted" style={{ margin: 0, lineHeight: 1.4 }}>
                <b>Executive Synthesis:</b> {app.aiInterview.summary}
              </p>
            )}
          </div>
        )}

        {isRevealed ? (
          <dl className="kv" style={{ margin: '12px 0' }}>
            <dt>Email</dt>
            <dd>{cand.email}</dd>
            <dt>Phone</dt>
            <dd>{cand.phone}</dd>
          </dl>
        ) : (
          <p
            className="sm muted row"
            style={{ gap: '6px', margin: '10px 0', alignItems: 'center' }}
          >
            <Lock size={14} /> Name and direct contact details unlock when you request an
            interview.
          </p>
        )}

        <div className="row" style={{ marginTop: '12px', gap: '8px' }}>
          {app.rejectPending ? (
            <span className="chip">Feedback sent to your recruiter</span>
          ) : app.stage === 'submitted' ? (
            isRejecting ? (
              <div style={{ width: '100%' }}>
                <p className="sm" style={{ fontWeight: 600, marginBottom: '8px' }}>
                  Why are you passing?
                </p>
                <div className="reasons">
                  {PASS_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      className="pill"
                      onClick={() => {
                        clientPass(app.id, reason);
                        setActiveRejectAppId(null);
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="linkbtn sm"
                    onClick={() => setActiveRejectAppId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => clientInterviewRequest(app.id)}
                >
                  Request interview
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => clientToggleHold(app.id)}
                >
                  {app.hold ? 'Remove hold' : 'Put on hold'}
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setActiveRejectAppId(app.id)}
                >
                  Pass
                </button>
              </>
            )
          ) : app.stage === 'interview' ? (
            <button
              type="button"
              className="btn primary sm"
              onClick={() => clientMakeOffer(app.id)}
            >
              Make an offer
            </button>
          ) : app.stage === 'offer' ? (
            <button
              type="button"
              className="btn primary sm"
              onClick={() => clientApproveOffer(app.id)}
            >
              Approve offer
            </button>
          ) : (
            <span className="chip good">Placed</span>
          )}
        </div>
      </article>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Client portal nav bar */}
      <div
        className="gut"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="inner row spread" style={{ paddingBlock: '14px' }}>
          <div className="brand">
            <Logo />
            <span className="wm">
              <b>CUBE TECH</b>
              <i>Client portal</i>
            </span>
          </div>

          <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
            <span className="muted sm">Previewing as</span>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              style={{ width: 'auto', minWidth: '200px' }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate('careers')}
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Careers Site
            </button>

            <button
              type="button"
              className="iconbtn"
              onClick={toggleTheme}
              aria-label="Switch colour theme"
              title="Switch colour theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>

      <TriStripe />

      {/* Main client content */}
      <div className="gut" style={{ flex: 1 }}>
        <div className="inner" style={{ paddingBlock: '28px' }}>
          <h1 className="caps" style={{ fontSize: '44px' }}>
            {client.name}
          </h1>
          <p className="muted" style={{ marginTop: '4px' }}>
            Candidates your recruiter has submitted. Names and contact details stay
            anonymized until you request an interview.
          </p>

          {clientJobs.length > 0 ? (
            clientJobs.map(j => {
              const submittedCandidates = applications.filter(
                a =>
                  a.jobId === j.id &&
                  ['submitted', 'interview', 'offer', 'placed'].includes(a.stage)
              );

              return (
                <section key={j.id} style={{ marginTop: '36px' }}>
                  <div className="row spread" style={{ margin: '22px 0 12px' }}>
                    <div>
                      <h2 className="caps" style={{ fontSize: '28px', margin: 0 }}>
                        {j.title}
                      </h2>
                      <span className="xs muted" style={{ display: 'block', marginTop: '2px' }}>
                        {j.location} · {j.type} · Closes {j.closes}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => toggleJobExpanded(j.id)}
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={13} />
                        {expandedJobIds.includes(j.id) ? 'Hide Role Scope' : 'View Role Scope'}
                        {expandedJobIds.includes(j.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <StatusChip status={getJobStatus(j)} />
                    </div>
                  </div>

                  {/* Expandable Rich Job Description */}
                  {expandedJobIds.includes(j.id) && (
                    <div
                      style={{
                        padding: '16px 20px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        marginBottom: '16px'
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Approved Role Specifications & Description
                      </h4>
                      <RichTextRenderer content={j.summary} />
                    </div>
                  )}

                  {submittedCandidates.length > 0 ? (
                    <div className="pack">
                      {submittedCandidates.map(app => renderCandidateCard(app))}
                    </div>
                  ) : (
                    <div className="empty">
                      No candidates submitted yet. Your recruiter sends a shortlist once
                      qualifications are confirmed.
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="empty" style={{ marginTop: '24px' }}>
              <b>No active roles assigned to this client yet.</b>
              <p style={{ marginTop: '6px' }}>
                Your recruitment team at Cube Tech Consults will publish openings here as they are scoped.
              </p>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
