import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AiInterviewQuestion } from '../../types';
import { generateAiInterviewQuestions } from '../../utils/aiInterviewHelper';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  MessageSquare,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Award
} from 'lucide-react';

export const AiInterviewInviteModal: React.FC = () => {
  const { modal, closeModal, applications, candidates, jobs, clients, inviteCandidateToAiInterview, showToast } = useApp();

  if (!modal || modal.type !== 'ai-interview-invite' || !modal.id) return null;

  const app = applications.find(a => a.id === modal.id);
  if (!app) return null;

  const candidate = candidates.find(c => c.id === app.candId);
  const job = jobs.find(j => j.id === app.jobId);
  const client = job ? clients.find(c => c.id === job.clientId) : null;

  const initialQuestions: AiInterviewQuestion[] = app.aiInterview?.questions && app.aiInterview.questions.length > 0
    ? app.aiInterview.questions
    : generateAiInterviewQuestions(job || {});

  const [questions, setQuestions] = useState<AiInterviewQuestion[]>(initialQuestions);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>(
    app.aiInterview?.token
      ? `${window.location.origin}/interview?token=${app.aiInterview.token}`
      : ''
  );
  const [isSending, setIsSending] = useState(false);

  const handleQuestionChange = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: text } : q));
  };

  const handleAddQuestion = () => {
    const newQ: AiInterviewQuestion = {
      id: `q-custom-${Date.now()}`,
      question: 'Please describe your specific experience with...',
      category: 'Role Competency & Custom Probe',
      expectedKeywords: ['experience', 'process', 'result']
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length <= 1) {
      showToast('At least one interview question is required.');
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleRegenerate = () => {
    const fresh = generateAiInterviewQuestions(job || {});
    setQuestions(fresh);
    showToast('Regenerated role-specific AI interview questions.');
  };

  const handleGenerateLink = async () => {
    setIsSending(true);
    const result = await inviteCandidateToAiInterview(app.id, questions);
    setIsSending(false);

    if (result) {
      setGeneratedLink(result.inviteUrl);
      return result.inviteUrl;
    }
    return null;
  };

  const handleCopyLink = async () => {
    let url = generatedLink;
    if (!url) {
      url = (await handleGenerateLink()) || '';
    }
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('AI interview link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsAppSms = async () => {
    let url = generatedLink;
    if (!url) {
      url = (await handleGenerateLink()) || '';
    }
    showToast(`WhatsApp & Termii SMS dispatched to ${candidate?.phone || 'Candidate'}: "Hi ${candidate?.name || 'Applicant'}, complete your AI screening interview here: ${url}"`);
  };

  const handleOpenRoom = async () => {
    let url = generatedLink;
    if (!url) {
      url = (await handleGenerateLink()) || '';
    }
    closeModal();
    window.location.href = url || '/interview';
  };

  return (
    <div style={{ maxWidth: '800px', width: '100%' }}>
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
          AI Candidate Screening
        </p>
      </div>

      <h2 style={{ marginBottom: '4px' }}>
        Invite {candidate?.name || 'Candidate'} to AI Interview
      </h2>
      <p className="muted sm" style={{ marginBottom: '16px' }}>
        Role: <b>{job?.title}</b> · Client: <b>{client?.name}</b> · Location: <b>{candidate?.loc}</b>
      </p>

      {/* Feature banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 204, 0, 0.08)',
          border: '1px solid rgba(255, 204, 0, 0.25)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Award size={22} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
        <div>
          <b style={{ color: 'var(--yellow-text, #fef08a)', fontSize: '14px' }}>
            Screen shortlisted applicants through an AI interview
          </b>
          <p className="xs muted" style={{ margin: 0, marginTop: '2px' }}>
            Save time by inviting top applicants to complete an AI interview. The applicant will answer structured questions via audio dictation or typing, and our AI model generates an objective evaluation scorecard.
          </p>
        </div>
      </div>

      {/* Questions list with customization */}
      <div className="row spread" style={{ marginBottom: '10px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', margin: 0 }}>
          Interview Questions ({questions.length})
        </h3>
        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleRegenerate}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={12} /> Regenerate
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleAddQuestion}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} /> Add Prompt
          </button>
        </div>
      </div>

      <div
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
          paddingRight: '4px'
        }}
      >
        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="row spread" style={{ marginBottom: '6px' }}>
              <span className="xs" style={{ fontWeight: 600, color: 'var(--yellow-text)' }}>
                {idx + 1}. {q.category}
              </span>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => handleRemoveQuestion(q.id)}
                style={{ padding: '2px 6px', color: 'var(--muted)' }}
                title="Remove question"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <textarea
              value={q.question}
              onChange={e => handleQuestionChange(q.id, e.target.value)}
              rows={2}
              style={{
                width: '100%',
                fontSize: '13px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
          </div>
        ))}
      </div>

      {/* Generated Link Box */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: 'var(--charcoal)',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}
      >
        <label className="xs caps muted" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>
          Candidate Unique Interview URL
        </label>
        <div className="row" style={{ gap: '8px', marginTop: '6px' }}>
          <input
            type="text"
            readOnly
            value={generatedLink || `${window.location.origin}/interview?token=int_${candidate?.id?.substring(0, 6) || 'active'}`}
            style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '8px 12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              border: '1px solid var(--border)'
            }}
          />
          <button
            type="button"
            className="btn ghost sm"
            onClick={handleCopyLink}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="row spread" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          className="btn ghost"
          onClick={handleOpenRoom}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ExternalLink size={14} /> Preview Interview Room
        </button>

        <div className="row" style={{ gap: '10px' }}>
          <button
            type="button"
            className="btn ghost"
            onClick={handleSendWhatsAppSms}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <MessageSquare size={14} /> Send WhatsApp / SMS
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={async () => {
              await handleGenerateLink();
              closeModal();
            }}
            disabled={isSending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} /> {isSending ? 'Sending...' : 'Send Interview Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};
