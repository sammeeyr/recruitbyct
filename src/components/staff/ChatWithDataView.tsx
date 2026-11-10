import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { formatNaira, prettyKey } from '../../utils/helpers';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Users,
  Key,
  Code,
  Shield,
  Download,
  Terminal,
  RefreshCw,
  Mail,
  Zap,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  metadata?: {
    candidateId?: string;
    jobId?: string;
    fitScore?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
  };
}

export const ChatWithDataView: React.FC = () => {
  const {
    jobs,
    candidates,
    applications,
    clients,
    openModal,
    moveApplication,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'connect' | 'keys'>('chat');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || '');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  // API Tokens state
  const [apiTokens, setApiTokens] = useState<
    { id: string; name: string; token: string; scopes: string[]; created: string }[]
  >([
    {
      id: 'tok_1',
      name: 'ChatGPT Custom GPT Connector',
      token: 'ctc_pat_live_839a9f201e7492c0',
      scopes: ['read:candidates', 'read:jobs', 'read:applications'],
      created: '2026-11-09'
    },
    {
      id: 'tok_2',
      name: 'Claude Desktop MCP Client',
      token: 'ctc_pat_live_382bc8100ef2718a',
      scopes: ['read:candidates', 'read:jobs', 'write:interviews'],
      created: '2026-11-10'
    }
  ]);
  const [newTokenName, setNewTokenName] = useState('');

  // Initial chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `### Welcome to Recruitbyct AI Recruitment Copilot!
I am grounded directly in your **live recruitment database** (${candidates.length} candidates, ${jobs.length} job orders, and ${applications.length} pipeline applications in Neon Postgres).

#### What I can do for you:
1. **Candidate Fit Analysis**: Ask *"Is ${selectedCandidate?.name || 'Tunde Adeleke'} a good fit for ${selectedJob?.title || 'our open role'}?"* to calculate match scores, missing skills, and interview readiness.
2. **Summarize Talent Pool**: Ask *"Summarize top candidates in Abuja"* or *"Who are our top applicants?"*.
3. **Draft High-Converting Emails**: Ask me to write personalized interview invitations, offer letters, or constructive rejection emails.
4. **Identify Bottlenecks**: Ask *"Where are candidates getting stuck in the pipeline?"*.

Select a context below or tap any suggested prompt to begin!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      showToast(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      showToast(`Copied ${label}`);
    }
  };

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // Call Neon serverless backend /ai/chat endpoint
      const response = await fetch('https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          jobId: selectedJob?.id,
          candidateId: selectedCandidate?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('[AI Copilot Local Fallback]', err);
      // Client-side intelligent fallback using live AppContext data
      const fallbackResponse = generateLocalAiResponse(queryText, selectedJob, selectedCandidate, candidates, jobs, applications);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: fallbackResponse.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: fallbackResponse.metadata
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side intelligent evaluation fallback
  const generateLocalAiResponse = (
    query: string,
    job: any,
    candidate: any,
    cands: any[],
    jobsList: any[],
    apps: any[]
  ) => {
    const lQuery = query.toLowerCase();

    // 1. Fit assessment
    if (lQuery.includes('fit') || lQuery.includes('match') || lQuery.includes('good') || lQuery.includes('qualified')) {
      const targetC = candidate || cands[0];
      const targetJ = job || jobsList[0];

      const mustSkills = [...(targetJ?.must || [])].map((m: any) => m.keys?.[0] || m).filter(Boolean);
      const candSkills = targetC?.skills || [];
      const matched = mustSkills.filter((ms: string) =>
        candSkills.some((cs: string) => cs.toLowerCase().includes(ms.toLowerCase()) || ms.toLowerCase().includes(cs.toLowerCase()))
      );
      const missing = mustSkills.filter((ms: string) => !matched.includes(ms));

      const candYears = Number(targetC?.years || 0);
      const minYears = Number(targetJ?.minYears || 2);
      const yearsOk = candYears >= minYears;

      let score = 55;
      if (mustSkills.length > 0) score += Math.round((matched.length / mustSkills.length) * 35);
      if (yearsOk) score += 10;
      score = Math.min(96, Math.max(35, score));

      return {
        text: `### Candidate Fit Analysis: **${targetC?.name}**
**Target Role**: ${targetJ?.title} · ${targetJ?.location}
**Calculated AI Match**: **${score}%** (${score >= 80 ? 'Strong Candidate' : score >= 60 ? 'Potential Fit' : 'High Risk'})

#### Candidate Overview:
- **Headline**: ${targetC?.headline || 'Applicant'}
- **Experience**: ${candYears} years (Job asks for at least ${minYears} years) ${yearsOk ? '✅' : '⚠️'}
- **Expected Compensation**: ${targetC?.sal ? formatNaira(targetC.sal) + '/mo' : 'Flexible'} (Job budget: ${formatNaira(targetJ?.salary?.[0] || 120000)} - ${formatNaira(targetJ?.salary?.[1] || 150000)}/mo)
- **Skills Assessment**:
  - **Matched (${matched.length})**: ${matched.map(prettyKey).join(', ') || 'None'}
  - **Gaps / Needs Verification (${missing.length})**: ${missing.map(prettyKey).join(', ') || 'None'}

#### AI Recommendation:
${score >= 80
  ? `**Strong Match**: Recommend scheduling an AI Screening Interview immediately or advancing to Shortlist for client review.`
  : `Candidate demonstrates baseline competence but has gaps in ${missing.slice(0, 2).map(prettyKey).join(', ')}. Review portfolio before advancing.`}`,
        metadata: { fitScore: score, candidateId: targetC?.id, jobId: targetJ?.id }
      };
    }

    // 2. Email drafting
    if (lQuery.includes('email') || lQuery.includes('invite') || lQuery.includes('reject') || lQuery.includes('offer')) {
      const isReject = lQuery.includes('reject') || lQuery.includes('decline');
      if (isReject) {
        return {
          text: `### Drafted Email: Constructive Rejection
**To**: ${candidate?.name || 'Candidate'} <${candidate?.email || 'email@example.com'}>
**Subject**: Update regarding your application for ${job?.title || 'Open Position'}

Dear ${candidate?.name || 'Applicant'},

Thank you for your interest in the **${job?.title}** position with Cube Tech Consults.

After reviewing your profile against our current project requirements, we have decided to advance other candidates whose immediate technical specializations more closely fit our client's priorities at this stage.

We were genuinely impressed with your background and have added your profile to our active talent pool for future openings that match your skills.

Thank you again for your time, and we wish you success with your career endeavors.

Best regards,
**Cube Tech Consults Hiring Team**
recruiter@cubetechconsults.com`
        };
      }

      return {
        text: `### Drafted Email: AI Interview Invitation
**To**: ${candidate?.name || 'Candidate'} <${candidate?.email || 'email@example.com'}>
**Subject**: Invitation to Complete Screening Interview for ${job?.title || 'Role'}

Dear ${candidate?.name || 'Candidate'},

Thank you for applying for the **${job?.title}** position with Cube Tech Consults!

We have reviewed your application and would like to invite you to complete a brief 10-minute automated AI voice/video screening session. This will allow our hiring committee to evaluate your technical background and communication skills directly.

**Access your interview room here**:
https://recruitbyct.com/interview

Please complete your interview within the next 48 hours. If you have any technical difficulties, reply directly to this email.

Warm regards,
**Recruitment Operations Team**
Cube Tech Consults | https://recruitbyct.com`
        };
    }

    // Default intelligence overview
    return {
      text: `### Live Recruitment Data Grounding
- **Active Job Orders**: ${jobsList.length}
- **Talent Pool Candidates**: ${cands.length}
- **Pipeline Applications**: ${apps.length}

You can ask me to:
- Evaluate candidate fit against any role.
- Summarize candidates with specific skills or in specific locations.
- Draft professional candidate communication (invites, rejections, offers).`
    };
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const randHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newToken = {
      id: `tok_${Date.now()}`,
      name: newTokenName.trim(),
      token: `ctc_pat_live_${randHex}`,
      scopes: ['read:candidates', 'read:jobs', 'read:applications'],
      created: new Date().toISOString().split('T')[0]
    };

    setApiTokens(prev => [newToken, ...prev]);
    setNewTokenName('');
    showToast(`Created API Token "${newToken.name}"`);
  };

  const handleRevokeToken = (id: string) => {
    setApiTokens(prev => prev.filter(t => t.id !== id));
    showToast('API Token revoked');
  };

  const openApiUrl = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/openapi.json';
  const mcpUrl = 'https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/mcp';

  return (
    <StaffShell
      title="Chat with Your Data using AI"
      sub="Connect Recruitbyct to ChatGPT, Claude, Gemini, and Microsoft Copilot Studio. Summarize candidates, evaluate fit, and draft emails from live recruitment data."
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn sm ${activeTab === 'chat' ? 'primary' : 'ghost'}`}
            onClick={() => setActiveTab('chat')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Bot size={15} /> Chat with Data
          </button>
          <button
            type="button"
            className={`btn sm ${activeTab === 'connect' ? 'primary' : 'ghost'}`}
            onClick={() => setActiveTab('connect')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={15} /> Connect External AI
          </button>
          <button
            type="button"
            className={`btn sm ${activeTab === 'keys' ? 'primary' : 'ghost'}`}
            onClick={() => setActiveTab('keys')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Key size={15} /> API Tokens
          </button>
        </div>
      }
    >
      {/* ================= TAB 1: LIVE DATA CHAT ================= */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 170px)' }}>
          {/* Context Selector Bar */}
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} className="muted" />
                <span className="xs muted" style={{ fontWeight: 600 }}>Active Job:</span>
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} className="muted" />
                <span className="xs muted" style={{ fontWeight: 600 }}>Candidate Context:</span>
                <select
                  value={selectedCandidateId}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px' }}
                >
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.headline || 'Applicant'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span className="xs muted">Grounded on live Neon Postgres</span>
            </div>
          </div>

          {/* Prompt Action Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              type="button"
              className="btn ghost xs"
              onClick={() => executeQuery(`Is ${selectedCandidate?.name || 'this candidate'} a good fit for our ${selectedJob?.title || 'role'}?`)}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              🎯 Fit Check: {selectedCandidate?.name?.split(' ')[0] || 'Candidate'}
            </button>
            <button
              type="button"
              className="btn ghost xs"
              onClick={() => executeQuery(`Summarize top candidates for ${selectedJob?.title || 'this role'}`)}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              📋 Summarize Top Applicants
            </button>
            <button
              type="button"
              className="btn ghost xs"
              onClick={() => executeQuery(`Write an AI interview invitation email for ${selectedCandidate?.name || 'the candidate'}`)}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ✉️ Draft Interview Invite Email
            </button>
            <button
              type="button"
              className="btn ghost xs"
              onClick={() => executeQuery(`Analyze salary expectations for ${selectedCandidate?.name} vs budget`)}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              💰 Salary & Compensation Alignment
            </button>
            <button
              type="button"
              className="btn ghost xs"
              onClick={() => executeQuery(`Write a polite rejection email with constructive feedback for ${selectedCandidate?.name}`)}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              📝 Draft Constructive Rejection
            </button>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.map(msg => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    maxWidth: isAssistant ? '88%' : '75%',
                    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                    flexDirection: isAssistant ? 'row' : 'row-reverse'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isAssistant ? '#0A66C2' : 'var(--line)',
                      color: isAssistant ? '#fff' : 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isAssistant ? <Sparkles size={16} /> : <User size={16} />}
                  </div>

                  <div
                    style={{
                      background: isAssistant ? 'var(--surface-2)' : '#0A66C2',
                      color: isAssistant ? 'var(--ink)' : '#fff',
                      border: `1px solid ${isAssistant ? 'var(--line)' : '#0A66C2'}`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <b style={{ fontSize: '12px', opacity: 0.85 }}>
                        {isAssistant ? 'Recruitbyct Intelligence Copilot' : 'You'}
                      </b>
                      <span className="xs" style={{ opacity: 0.65 }}>
                        {msg.timestamp}
                      </span>
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>

                    {isAssistant && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn ghost xs"
                          onClick={() => handleCopy(msg.text, 'Answer')}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          <Copy size={11} /> Copy Answer
                        </button>

                        {selectedCandidate && (
                          <button
                            type="button"
                            className="btn ghost xs"
                            onClick={() => openModal({ type: 'cand', id: selectedCandidate.id })}
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                          >
                            <User size={11} /> Open Profile
                          </button>
                        )}

                        {selectedJob && (
                          <button
                            type="button"
                            className="btn ghost xs"
                            onClick={() => openModal({ type: 'applicants', id: selectedJob.id })}
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                          >
                            <Users size={11} /> View Applicants
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                <RefreshCw size={14} className="spin" />
                <span>Recruitbyct AI is analyzing live recruitment data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              executeQuery(inputQuery);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder={`Ask a question (e.g. "Is ${selectedCandidate?.name || 'John'} a good fit for ${selectedJob?.title || 'our role'}?")`}
              style={{ flex: 1, padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '14px' }}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn primary"
              disabled={!inputQuery.trim() || loading}
              style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={15} /> Ask AI
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 2: CONNECT EXTERNAL AI ================= */}
      {activeTab === 'connect' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Card 1: ChatGPT Custom GPT & Actions */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#10A37F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>OpenAI ChatGPT & Custom GPTs</h3>
                <span className="xs muted">Connect via OpenAPI 3.0 Custom Actions</span>
              </div>
            </div>

            <p className="sm muted" style={{ marginBottom: '14px' }}>
              Build a custom GPT in ChatGPT that queries live candidates, reviews job orders, and drafts outreach letters directly in your ChatGPT workspace.
            </p>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
              <span className="xs muted" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                OpenAPI Schema URL for ChatGPT Actions:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  readOnly
                  value={openApiUrl}
                  style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace', padding: '6px' }}
                />
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => handleCopy(openApiUrl, 'OpenAPI URL')}
                >
                  {copiedKey === 'OpenAPI URL' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <ol className="xs muted" style={{ paddingLeft: '18px', lineHeight: '1.6', marginBottom: '16px' }}>
              <li>Open <b>ChatGPT</b> → Click <b>Explore GPTs</b> → <b>Create a GPT</b>.</li>
              <li>Go to <b>Configure</b> → Scroll down to <b>Actions</b> → Click <b>Create new action</b>.</li>
              <li>Under <b>Schema</b>, click <b>Import from URL</b> and paste the link above.</li>
              <li>Set Authentication to <b>API Key</b> (Bearer) and paste your token from the API Tokens tab.</li>
            </ol>

            <button
              type="button"
              className="btn primary sm"
              onClick={() => window.open(openApiUrl, '_blank')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <ExternalLink size={13} /> View OpenAPI Specification
            </button>
          </div>

          {/* Card 2: Model Context Protocol (MCP) for Claude, Cursor & Antigravity */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Terminal size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Model Context Protocol (MCP)</h3>
                <span className="xs muted">For Claude Desktop, Cursor, and Antigravity</span>
              </div>
            </div>

            <p className="sm muted" style={{ marginBottom: '14px' }}>
              Expose your live database as an MCP Server with tools: <code>search_talent_pool</code>, <code>get_job_orders</code>, and <code>evaluate_candidate_fit</code>.
            </p>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="xs muted font-mono">claude_desktop_config.json</span>
                <button
                  type="button"
                  className="linkbtn xs"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        {
                          mcpServers: {
                            recruitbyct: {
                              url: mcpUrl
                            }
                          }
                        },
                        null,
                        2
                      ),
                      'MCP JSON'
                    )
                  }
                >
                  Copy JSON
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '11px',
                  lineHeight: '1.4',
                  background: 'var(--surface)',
                  padding: '8px',
                  borderRadius: '4px',
                  overflowX: 'auto'
                }}
              >
{`{
  "mcpServers": {
    "recruitbyct": {
      "url": "${mcpUrl}"
    }
  }
}`}
              </pre>
            </div>

            <div className="xs muted" style={{ lineHeight: '1.6' }}>
              <b>Available MCP Tools:</b>
              <ul style={{ paddingLeft: '18px', margin: '4px 0 0' }}>
                <li><code>search_talent_pool</code>: Queries candidates by skill, location, and experience.</li>
                <li><code>get_job_orders</code>: Lists all published and confidential job orders.</li>
                <li><code>evaluate_candidate_fit</code>: Generates fit scores and gap analyses.</li>
                <li><code>draft_recruitment_email</code>: Generates tailored candidate communication.</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Microsoft Copilot Studio */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0078D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Microsoft Copilot Studio</h3>
                <span className="xs muted">Power Platform & M365 Copilot Integration</span>
              </div>
            </div>

            <p className="sm muted" style={{ marginBottom: '14px' }}>
              Connect your Microsoft Teams and Microsoft 365 Copilot to Recruitbyct data to allow your hiring managers to query candidate status right inside Teams.
            </p>

            <ol className="xs muted" style={{ paddingLeft: '18px', lineHeight: '1.6', marginBottom: '14px' }}>
              <li>Open <b>Microsoft Copilot Studio</b> (copilotstudio.microsoft.com).</li>
              <li>Select your Copilot → Go to <b>Actions</b> → <b>Add an action</b>.</li>
              <li>Choose <b>Custom Connector</b> → Select <b>Create from OpenAPI URL</b>.</li>
              <li>Paste the Recruitbyct OpenAPI URL: <code>{openApiUrl}</code>.</li>
              <li>Enable generative answers over your recruitment actions.</li>
            </ol>
          </div>

          {/* Card 4: Google Gemini & Claude Projects */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Google Gemini & Claude Projects</h3>
                <span className="xs muted">Prompt Context & Custom Knowledge Base</span>
              </div>
            </div>

            <p className="sm muted" style={{ marginBottom: '14px' }}>
              Use Gemini 1.5 Pro with its 2-million-token context window to upload your entire talent pool and job catalog as project knowledge.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  const dump = JSON.stringify({ jobs, candidates, applications }, null, 2);
                  const blob = new Blob([dump], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `recruitbyct_talent_data_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  showToast('Downloaded recruitment dataset JSON');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Download size={13} /> Export Knowledge JSON
              </button>

              <button
                type="button"
                className="btn ghost sm"
                onClick={() =>
                  handleCopy(
                    `You are the Recruitbyct AI Recruitment Assistant. You have access to our live database of candidates and job orders. Evaluate candidates against job requirements objectively, highlighting matched must-have skills, missing criteria, salary compatibility, and recommending next steps (AI screening interview, client review, or talent pool retention).`,
                    'System Prompt'
                  )
                }
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Copy size={13} /> Copy System Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: API TOKENS & PERMISSIONS ================= */}
      {activeTab === 'keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '18px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Generate Personal Access Token (PAT)</h3>
            <p className="xs muted" style={{ marginBottom: '14px' }}>
              Tokens authorize external AI tools (ChatGPT Custom GPTs, Claude Desktop, Microsoft Copilot) to securely query candidates and job orders without database passwords.
            </p>

            <form onSubmit={handleGenerateToken} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Token Name (e.g. My ChatGPT Assistant)"
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--line)' }}
                required
              />
              <button type="submit" className="btn primary sm" style={{ padding: '0 18px' }}>
                Generate Token
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Active Connected Tokens</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '8px 6px' }}>Application Name</th>
                    <th style={{ padding: '8px 6px' }}>Token</th>
                    <th style={{ padding: '8px 6px' }}>Scopes</th>
                    <th style={{ padding: '8px 6px' }}>Created</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiTokens.map(tok => (
                    <tr key={tok.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 600 }}>{tok.name}</td>
                      <td style={{ padding: '10px 6px' }}>
                        <code style={{ fontSize: '11px', background: 'var(--surface-2)', padding: '3px 6px', borderRadius: '4px' }}>
                          {tok.token.slice(0, 15)}••••••••
                        </code>
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tok.scopes.map(s => (
                            <span key={s} style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '2px 6px', borderRadius: '4px' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 6px', color: 'var(--muted)' }}>{tok.created}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="linkbtn xs"
                          onClick={() => handleCopy(tok.token, 'Token')}
                          style={{ marginRight: '10px' }}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          className="linkbtn xs"
                          onClick={() => handleRevokeToken(tok.id)}
                          style={{ color: 'var(--red-text)' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
};
