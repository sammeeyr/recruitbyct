import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, LOCATIONS } from '../../data/mockData';
import { addDays, formatNaira } from '../../utils/helpers';
import { RichTextEditor, MAX_JOB_DESCRIPTION_WORDS } from '../common/RichTextEditor';
import { countWords } from '../common/RichTextRenderer';
import {
  X,
  Sparkles,
  Wand2,
  Building,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const NewJobOrderModal: React.FC = () => {
  const { modal, closeModal, clients, draftNewJobOrder } = useApp();
  const { user } = useAuth();

  const isPlatformAdmin = user.role === 'agency_admin';

  const [clientId, setClientId] = useState(modal?.clientId || clients[0]?.id || 'c1');
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('Abuja');
  const [cat, setCat] = useState('Customer service');
  const [minPay, setMinPay] = useState(300000);
  const [maxPay, setMaxPay] = useState(450000);
  const [minYears, setMinYears] = useState(3);
  const [closes, setCloses] = useState(addDays(21));

  // Rich Job Description (supports up to 10,000 words)
  const [description, setDescription] = useState('');

  // Platform Admin Settings
  const [autoPublishAdmin, setAutoPublishAdmin] = useState(isPlatformAdmin);

  // AI Prompt Draft Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (modal?.clientId) {
      setClientId(modal.clientId);
    }
  }, [modal?.clientId]);

  if (!modal || (modal.type !== 'newjob' && modal.type !== 'aidraft')) return null;

  const selectedClient = clients.find(c => c.id === clientId);
  const wordCount = countWords(description);
  const isOverWordLimit = wordCount > MAX_JOB_DESCRIPTION_WORDS;

  const handleAiAutoFill = () => {
    if (!aiPrompt.trim()) return;
    setIsAiDrafting(true);
    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      let generatedTitle = aiPrompt.trim().replace(/^draft a /i, '').replace(/^new role /i, '');
      let generatedCat = 'Customer service';
      let generatedMin = 350000;
      let generatedMax = 500000;
      let generatedYears = 3;

      if (
        lower.includes('tech') ||
        lower.includes('react') ||
        lower.includes('software') ||
        lower.includes('developer') ||
        lower.includes('python') ||
        lower.includes('backend')
      ) {
        generatedTitle = 'Senior Full Stack Software Engineer';
        generatedCat = 'Technology';
        generatedMin = 1000000;
        generatedMax = 1600000;
        generatedYears = 4;
      } else if (lower.includes('finance') || lower.includes('account') || lower.includes('audit')) {
        generatedTitle = 'Finance & Compliance Officer';
        generatedCat = 'Finance';
        generatedMin = 450000;
        generatedMax = 700000;
        generatedYears = 3;
      } else if (lower.includes('sales') || lower.includes('business development') || lower.includes('fmcg')) {
        generatedTitle = 'Enterprise Business Development Manager';
        generatedCat = 'Sales';
        generatedMin = 400000;
        generatedMax = 650000;
        generatedYears = 3;
      } else if (lower.includes('lead') || lower.includes('manager') || lower.includes('supervisor')) {
        generatedTitle = 'Customer Support Team Lead';
        generatedCat = 'Customer service';
        generatedMin = 450000;
        generatedMax = 650000;
        generatedYears = 4;
      }

      setTitle(generatedTitle);
      setCat(generatedCat);
      setMinPay(generatedMin);
      setMaxPay(generatedMax);
      setMinYears(generatedYears);

      if (lower.includes('lagos')) setLoc('Lagos');
      else if (lower.includes('abuja')) setLoc('Abuja');
      else if (lower.includes('remote')) setLoc('Remote');
      else if (lower.includes('ph') || lower.includes('port harcourt')) setLoc('Port Harcourt');

      // AI Draft rich description
      const richDraft = `## Role Overview: ${generatedTitle}
${selectedClient?.name || 'Cube Tech Consults'} is seeking a high-caliber **${generatedTitle}** to join our fast-growing operations in ${loc}. This role delivers mission-critical leadership, operational execution, and stakeholder value.

### Key Objectives & Outcomes
- Champion end-to-end milestone delivery in accordance with client service standards
- Streamline team workflows, reporting cadence, and first-contact SLA resolution
- Implement structured KPI tracking and proactive bottleneck remediation

### Core Responsibilities
- **Execution & Oversight:** Drive daily deliverables and supervise core operational deliverables
- **Stakeholder Communication:** Serve as the strategic bridge between executive leadership and cross-functional teams
- **Quality & Standards:** Enforce rigorous standard operating procedures (SOPs) and compliance guidelines
- **Team Leadership:** Mentor junior specialists and foster an environment of continuous improvement

### Candidate Profile & Scorecard Criteria
- Minimum of ${generatedYears}+ years of verifiable experience in ${generatedCat}
- Advanced analytical problem-solving and executive presentation abilities
- High proficiency with modern digital platforms, CRM/ERP systems, and collaborative software
- Excellent written and verbal communication skills in corporate environments

> **About ${selectedClient?.name || 'Cube Tech Consults'}:** Leading corporate employer driving digital transformation and talent excellence across Nigeria.`;

      setDescription(richDraft);
      setIsAiDrafting(false);
    }, 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a valid job title.');
      return;
    }
    if (isOverWordLimit) {
      setErrorMessage(`Job description exceeds maximum limit of ${MAX_JOB_DESCRIPTION_WORDS.toLocaleString()} words.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await draftNewJobOrder({
        clientId,
        title: title.trim(),
        loc,
        cat,
        minPay: Number(minPay),
        maxPay: Number(maxPay),
        minYears: Number(minYears),
        closes,
        summary: description.trim() || undefined,
        autoApprove: isPlatformAdmin && autoPublishAdmin
      });
      closeModal();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create job order. Please try again.');
      setIsSubmitting(false);
    }
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

      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="chip warn" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> AI Role Drafter
          </span>
          {isPlatformAdmin && (
            <span
              className="chip good"
              style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
            >
              <ShieldCheck size={12} /> Platform Admin Mode: Client Job Creation
            </span>
          )}
        </div>
        {selectedClient && (
          <span className="xs muted">
            Posting for: <b style={{ color: 'var(--ink)' }}>{selectedClient.name}</b>
          </span>
        )}
      </div>

      <h2 style={{ marginBottom: '4px' }}>
        {isPlatformAdmin ? 'Create Job for Client' : 'New Job Order'}
      </h2>
      <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
        {isPlatformAdmin
          ? 'Platform Admins can create and directly activate verified recruitment positions for any corporate client employer with full 10,000-word rich formatting.'
          : 'Draft a client job order. AI drafts the initial scorecard and responsibilities. Paystack listing fee (₦10,000) applies upon publication.'}
      </p>

      {/* AI Prompt Draft Box */}
      <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Wand2 size={14} style={{ color: 'var(--yellow)' }} />
          <b style={{ fontSize: '13px' }}>AI Natural Language Drafter</b>
          <span className="xs muted">— Generate title, scorecard and multi-section description</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. Lead React Developer for Savanna Logistics in Lagos, 4 yrs exp, ₦1.2M pay..."
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAiAutoFill();
              }
            }}
            style={{ fontSize: '13px' }}
          />
          <button
            type="button"
            className="btn yellow sm"
            onClick={handleAiAutoFill}
            disabled={!aiPrompt.trim() || isAiDrafting}
            style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
          >
            {isAiDrafting ? 'Drafting...' : 'AI Auto-Fill'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Client Selection */}
        <div className="field">
          <label htmlFor="nj-c" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} /> Client Employer
          </label>
          <select
            id="nj-c"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            required
            style={{ fontWeight: 600 }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.industry || 'Corporate'}) · {c.fee}% placement fee
              </option>
            ))}
          </select>
          <span className="xs muted" style={{ display: 'block', marginTop: '3px' }}>
            The job and its candidate pipeline will be assigned to this client employer.
          </span>
        </div>

        {/* Job Title */}
        <div className="field">
          <label htmlFor="nj-t">Job title</label>
          <input
            id="nj-t"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Customer Success Lead, Finance Controller, Senior Backend Engineer"
          />
        </div>

        {/* Location & Category */}
        <div className="two">
          <div className="field">
            <label htmlFor="nj-l">Location</label>
            <select id="nj-l" value={loc} onChange={e => setLoc(e.target.value)}>
              {LOCATIONS.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="nj-k">Category</label>
            <select id="nj-k" value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pay Range */}
        <div className="two">
          <div className="field">
            <label htmlFor="nj-pmin">Min monthly pay (₦)</label>
            <input
              id="nj-pmin"
              type="number"
              step="10000"
              required
              value={minPay}
              onChange={e => setMinPay(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="nj-pmax">Max monthly pay (₦)</label>
            <input
              id="nj-pmax"
              type="number"
              step="10000"
              required
              value={maxPay}
              onChange={e => setMaxPay(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Experience & Closing Date */}
        <div className="two">
          <div className="field">
            <label htmlFor="nj-y">Min experience (years)</label>
            <input
              id="nj-y"
              type="number"
              min="0"
              max="20"
              value={minYears}
              onChange={e => setMinYears(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="nj-cl">Application closes</label>
            <input
              id="nj-cl"
              type="date"
              value={closes}
              onChange={e => setCloses(e.target.value)}
            />
          </div>
        </div>

        {/* Full Rich Text Job Description (Up to 10,000 Words) */}
        <RichTextEditor
          value={description}
          onChange={setDescription}
          label="Comprehensive Job Description & Overview (Up to 10,000 words)"
          placeholder="Draft or paste a detailed job description, duties, qualifications, and benefits with rich markdown formatting..."
          helperText="Supports rich headings, bold, italic, bullet lists, numbered steps, and quotes. Text is preserved across careers site and client portal."
          minHeight="220px"
        />

        {/* Platform Admin Instant Publication Option */}
        {isPlatformAdmin && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              marginBottom: '14px'
            }}
          >
            <label className="check" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={autoPublishAdmin}
                onChange={e => setAutoPublishAdmin(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} style={{ color: '#10B981' }} />
                Platform Admin Direct Activation (Publish live & waive ₦10k listing fee for client)
              </span>
            </label>
            <p className="xs muted" style={{ margin: '4px 0 0 24px' }}>
              When enabled, the position immediately becomes live on /careers without draft delay or Paystack payment prompt.
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '14px',
              color: 'var(--red)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn ghost" onClick={closeModal} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={isSubmitting || isOverWordLimit}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              'Creating Job Order...'
            ) : isPlatformAdmin && autoPublishAdmin ? (
              <>
                <Zap size={14} /> Create & Publish for Client
              </>
            ) : (
              'Draft with AI scorecard'
            )}
          </button>
        </div>
      </form>
    </>
  );
};
