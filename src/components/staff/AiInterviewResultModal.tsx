import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

export const AiInterviewResultModal: React.FC = () => {
  const {
    modal,
    closeModal,
    applications,
    candidates,
    jobs,
    clients,
    moveApplication,
    showToast
  } = useApp();

  if (!modal || modal.type !== 'ai-interview-result' || !modal.id) return null;

  const app = applications.find(a => a.id === modal.id);
  if (!app) return null;

  const candidate = candidates.find(c => c.id === app.candId);
  const job = jobs.find(j => j.id === app.jobId);
  const client = job ? clients.find(c => c.id === job.clientId) : null;
  const interview = app.aiInterview;

  if (!interview || !candidate || !job) return null;

  const overallScore = interview.overallScore || 82;
  const rec = interview.recommendation || 'Advance';
  const recColor =
    rec === 'Strong Hire'
      ? '#10b981'
      : rec === 'Advance'
      ? '#f59e0b'
      : '#ef4444';

  const handleAdvanceToClient = () => {
    moveApplication(app.id, 'submitted');
    closeModal();
    showToast(`Candidate ${candidate.name} advanced to Client Submission.`);
  };

  const handleCopySummary = () => {
    const text = `Candidate: ${candidate.name}\nRole: ${job.title}\nAI Interview Score: ${overallScore}/100 (${rec})\n\nSummary:\n${interview.summary || ''}\n\nEvaluated by Cube Tech Consults AI Engine.`;
    navigator.clipboard.writeText(text);
    showToast('Scorecard summary copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '840px', width: '100%' }}>
      <button
        type="button"
        className="btn ghost sm close"
        onClick={closeModal}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div className="row" style={{ gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 204, 0, 0.15)',
            color: 'var(--yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Sparkles size={18} />
        </div>
        <p className="xs caps" style={{ letterSpacing: '.12em', fontWeight: 700, color: 'var(--yellow-text)' }}>
          AI Candidate Interview Scorecard
        </p>
      </div>

      <h2 style={{ marginBottom: '4px' }}>{candidate.name}</h2>
      <p className="muted sm" style={{ marginBottom: '20px' }}>
        {job.title} · {client?.name} · {candidate.loc} · {candidate.years} years exp
      </p>

      {/* Score Overview Card */}
      <div
        className="kcard"
        style={{
          padding: '24px',
          borderRadius: '14px',
          backgroundColor: 'var(--charcoal)',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        <div className="row spread" style={{ flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: `4px solid ${recColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--panel)'
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{overallScore}</span>
              <span className="xs muted">/ 100</span>
            </div>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  backgroundColor: `${recColor}20`,
                  color: recColor,
                  marginBottom: '4px'
                }}
              >
                {rec.toUpperCase()}
              </span>
              <h3 style={{ margin: 0, fontSize: '18px' }}>AI Competency Score</h3>
              <p className="xs muted" style={{ margin: 0 }}>
                Status: Completed on {interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'Today'}
              </p>
            </div>
          </div>

          <div className="row" style={{ gap: '10px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={handleCopySummary}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Copy size={13} /> Copy Summary
            </button>
            {app.stage !== 'submitted' && app.stage !== 'offer' && app.stage !== 'placed' && (
              <button
                type="button"
                className="btn primary sm"
                onClick={handleAdvanceToClient}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Advance to Client <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {interview.summary && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderLeft: `4px solid ${recColor}`,
              fontSize: '13px',
              lineHeight: 1.6
            }}
          >
            <b>AI Synthesis:</b> {interview.summary}
          </div>
        )}
      </div>

      {/* Breakdown per response */}
      <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
        Evaluated Responses ({interview.responses?.length || 0})
      </h3>

      <div
        style={{
          maxHeight: '340px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '4px',
          marginBottom: '20px'
        }}
      >
        {interview.responses && interview.responses.length > 0 ? (
          interview.responses.map((resp, i) => (
            <div
              key={resp.questionId || i}
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border)'
              }}
            >
              <div className="row spread" style={{ marginBottom: '8px' }}>
                <span className="xs caps" style={{ fontWeight: 700, color: 'var(--yellow-text)' }}>
                  Question {i + 1}
                </span>
                <span className="score ok" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {resp.score}%
                </span>
              </div>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', lineHeight: 1.4 }}>
                {resp.questionText}
              </h4>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--panel)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  marginBottom: '10px',
                  fontStyle: 'italic',
                  color: 'var(--text-subtle)'
                }}
              >
                "{resp.answerText}"
              </div>

              <div className="row spread xs muted" style={{ marginBottom: '6px' }}>
                <span>Technical Precision: <b>{resp.technicalScore}%</b></span>
                <span>Communication Clarity: <b>{resp.clarityScore}%</b></span>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  lineHeight: 1.5,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 204, 0, 0.08)',
                  color: 'var(--yellow-text, #fef08a)'
                }}
              >
                <b>AI Critique:</b> {resp.feedback}
              </div>
            </div>
          ))
        ) : (
          <p className="xs muted">No response details available.</p>
        )}
      </div>

      <div className="row spread" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            closeModal();
            window.location.href = `/interview?token=${interview.token}`;
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ExternalLink size={14} /> Open Candidate View
        </button>

        <button type="button" className="btn ghost" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );
};
