import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JobOrder } from '../../types';
import { CATEGORIES, LOCATIONS } from '../../data/mockData';
import { formatNaira, addDays, getJobSlug } from '../../utils/helpers';
import { RichTextEditor, MAX_JOB_DESCRIPTION_WORDS } from '../common/RichTextEditor';
import { countWords } from '../common/RichTextRenderer';
import { X, Sparkles, Plus, Trash2, CheckCircle2, AlertTriangle, Save, Building, Copy, Link2, ExternalLink } from 'lucide-react';

export const EditJobOrderModal: React.FC = () => {
  const { modal, closeModal, jobs, clients, updateJobOrder, deleteJobOrder } = useApp();

  if (!modal || modal.type !== 'editjob' || !modal.id) return null;

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);

  // Form State
  const [clientId, setClientId] = useState(job.clientId);
  const [title, setTitle] = useState(job.title);
  const [slug, setSlug] = useState(job.slug || getJobSlug(job));
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [location, setLocation] = useState(job.location);
  const [type, setType] = useState(job.type);
  const [category, setCategory] = useState(job.category);
  const [minSalary, setMinSalary] = useState(job.salary[0]);
  const [maxSalary, setMaxSalary] = useState(job.salary[1]);
  const [minYears, setMinYears] = useState(job.minYears || 3);
  const [closes, setCloses] = useState(job.closes || addDays(30));
  const [summary, setSummary] = useState(job.summary);
  const [duties, setDuties] = useState<string[]>(job.duties || []);
  const [newDuty, setNewDuty] = useState('');
  const [mustSkills, setMustSkills] = useState<{ label: string; keys: string[] }[]>(job.must || []);
  const [newMustLabel, setNewMustLabel] = useState('');
  const [newMustKeys, setNewMustKeys] = useState('');
  const [niceSkills, setNiceSkills] = useState<{ label: string; keys: string[]; w?: number }[]>(job.nice || []);
  const [newNiceLabel, setNewNiceLabel] = useState('');
  const [newNiceKeys, setNewNiceKeys] = useState('');
  const [newNiceWeight, setNewNiceWeight] = useState(10);
  const [published, setPublished] = useState(job.listing.published);
  const [confidential, setConfidential] = useState(job.listing.confidential);
  const [showSalary, setShowSalary] = useState(job.listing.showSalary);
  const [state, setState] = useState(job.state);

  const [aiPolishing, setAiPolishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI Polish & Enhance (AI Draft + Edit)
  const handleAiPolish = () => {
    setAiPolishing(true);
    setTimeout(() => {
      // Intelligently refine role summary
      const refinedSummary = `${title} will champion customer satisfaction and operational excellence at Cube Tech Consults. This role drives end-to-end service delivery, rapid issue resolution, and cross-functional collaboration in high-growth environments across Nigeria and remote teams.`;
      setSummary(refinedSummary);

      // Enhance duties with measurable metrics
      const enhancedDuties = [
        `Lead cross-functional operations and KPI milestones for ${title}`,
        'Achieve over 98% first-contact SLA resolution across email, phone, and ticketing',
        'Analyze weekly performance metrics and implement preventative escalation workflows',
        'Mentor junior team members and maintain structured SOP documentation',
        'Maintain compliance with ISO customer excellence and client SLA standards'
      ];
      setDuties(enhancedDuties);

      // Optimize keywords
      const optimizedMust = [
        ...mustSkills,
        {
          label: `${category} Core Competencies`,
          keys: [category.toLowerCase(), 'escalation management', 'communication', 'sop']
        }
      ];
      setMustSkills(optimizedMust);

      setAiPolishing(false);
    }, 600);
  };

  const handleAddDuty = () => {
    if (!newDuty.trim()) return;
    setDuties(prev => [...prev, newDuty.trim()]);
    setNewDuty('');
  };

  const handleRemoveDuty = (index: number) => {
    setDuties(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMustSkill = () => {
    if (!newMustLabel.trim() || !newMustKeys.trim()) return;
    const keysArray = newMustKeys.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    setMustSkills(prev => [...prev, { label: newMustLabel.trim(), keys: keysArray }]);
    setNewMustLabel('');
    setNewMustKeys('');
  };

  const handleRemoveMustSkill = (index: number) => {
    setMustSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNiceSkill = () => {
    if (!newNiceLabel.trim() || !newNiceKeys.trim()) return;
    const keysArray = newNiceKeys.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    setNiceSkills(prev => [...prev, { label: newNiceLabel.trim(), keys: keysArray, w: Number(newNiceWeight) || 10 }]);
    setNewNiceLabel('');
    setNewNiceKeys('');
    setNewNiceWeight(10);
  };

  const handleRemoveNiceSkill = (index: number) => {
    setNiceSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countWords(summary) > MAX_JOB_DESCRIPTION_WORDS) {
      setServerError(`Job description exceeds maximum limit of ${MAX_JOB_DESCRIPTION_WORDS.toLocaleString()} words.`);
      return;
    }

    setIsSaving(true);
    setServerError(null);

    const result = await updateJobOrder(job.id, {
      clientId,
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, ''),
      location,
      type,
      category,
      salary: [Number(minSalary), Number(maxSalary)],
      minYears: Number(minYears),
      closes,
      summary: summary.trim(),
      duties,
      must: mustSkills,
      nice: niceSkills,
      state,
      approved: state === 'open' ? true : job.approved,
      listing: {
        published,
        confidential,
        showSalary
      }
    });

    setIsSaving(false);
    if (result.success) {
      closeModal();
    } else {
      setServerError(result.error || 'Failed to save to Neon Serverless Postgres. Changes have been preserved locally.');
    }
  };

  const handleDelete = () => {
    deleteJobOrder(job.id);
    closeModal();
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p className="xs caps" style={{ letterSpacing: '.12em', fontWeight: 600, color: 'var(--red-text)' }}>
          Edit Job Role · {client?.name || 'Cube Tech Consults'}
        </p>
        <button
          type="button"
          className="btn yellow sm"
          onClick={handleAiPolish}
          disabled={aiPolishing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <Sparkles size={14} /> {aiPolishing ? 'AI Refining...' : 'AI Draft + Polish'}
        </button>
      </div>

      <h2>Edit Role: {job.title}</h2>
      <p className="muted" style={{ marginBottom: '18px' }}>
        Modify job specifications, scorecard rubrics, and publication status. All updates sync immediately to Neon Postgres.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Client Selection */}
        <div className="field">
          <label htmlFor="edit-client" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} /> Client Employer
          </label>
          <select
            id="edit-client"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            required
            style={{ fontWeight: 600 }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.industry || 'Corporate'}) · {c.fee}% fee
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="edit-title">Job Title</label>
          <input
            id="edit-title"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Custom Job URL & Slug Configuration */}
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="edit-slug" style={{ fontSize: '13px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Link2 size={13} style={{ color: 'var(--red-text)' }} /> Public Job Application URL & Slug
            </label>
            <button
              type="button"
              className="linkbtn xs"
              onClick={() => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/jobs/${slug}`;
                navigator.clipboard.writeText(url);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
              style={{ color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Copy size={11} /> {copiedUrl ? 'Copied Link!' : 'Copy Direct Link'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px', padding: '6px 10px' }}>
            <span className="mono xs muted" style={{ userSelect: 'none' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/jobs/
            </span>
            <input
              id="edit-slug"
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
              placeholder="e.g. customer-experience-strategist"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                color: 'var(--ink)',
                flex: 1
              }}
            />
          </div>
          <span className="xs muted" style={{ display: 'block', marginTop: '4px' }}>
            Applicants accessing this URL are routed directly to this job's overview and application process.
          </span>
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="edit-loc">Location</label>
            <select id="edit-loc" value={location} onChange={e => setLocation(e.target.value)}>
              {LOCATIONS.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-cat">Category</label>
            <select id="edit-cat" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="edit-minpay">Minimum Monthly Pay (₦)</label>
            <input
              id="edit-minpay"
              type="number"
              step="10000"
              required
              value={minSalary}
              onChange={e => setMinSalary(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-maxpay">Maximum Monthly Pay (₦)</label>
            <input
              id="edit-maxpay"
              type="number"
              step="10000"
              required
              value={maxSalary}
              onChange={e => setMaxSalary(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="edit-years">Min Experience (Years)</label>
            <input
              id="edit-years"
              type="number"
              min="0"
              max="20"
              value={minYears}
              onChange={e => setMinYears(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-state">Role Status</label>
            <select id="edit-state" value={state} onChange={e => setState(e.target.value as any)}>
              <option value="draft">Draft (Unpublished)</option>
              <option value="open">Open (Active Hiring)</option>
              <option value="filled">Filled (Placement Made)</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Full Rich Text Job Description (Up to 10,000 words) */}
        <RichTextEditor
          value={summary}
          onChange={setSummary}
          label="Comprehensive Job Description & Overview (Up to 10,000 words)"
          placeholder="Detailed job description, responsibilities, technical requirements, benefits, and working culture..."
          helperText="Supports rich markdown formatting (headings, bold, italic, bullet lists, numbered steps, quotes). Max 10,000 words."
          minHeight="260px"
        />

        {/* Duties Section */}
        <div className="field">
          <label>Core Responsibilities & Deliverables</label>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {duties.map((duty, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <span>{duty}</span>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => handleRemoveDuty(idx)}
                  style={{ color: 'var(--red)' }}
                  aria-label="Remove duty"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add key duty or deliverable..."
              value={newDuty}
              onChange={e => setNewDuty(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDuty();
                }
              }}
            />
            <button type="button" className="btn ghost sm" onClick={handleAddDuty}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Must-Have Skills Section */}
        <div className="field">
          <label>Must-Have Skills & Keyword Triggers (Scorecard)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
            {mustSkills.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <b>{m.label}</b>
                  <span className="muted xs" style={{ marginLeft: '8px' }}>
                    Keywords: {m.keys.join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => handleRemoveMustSkill(idx)}
                  style={{ color: 'var(--red)' }}
                  aria-label="Remove must skill"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
            <input
              type="text"
              placeholder="Skill label (e.g. Zendesk CRM)"
              value={newMustLabel}
              onChange={e => setNewMustLabel(e.target.value)}
            />
            <input
              type="text"
              placeholder="Keywords comma-separated (e.g. zendesk, crm)"
              value={newMustKeys}
              onChange={e => setNewMustKeys(e.target.value)}
            />
            <button type="button" className="btn ghost sm" onClick={handleAddMustSkill}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Nice-to-Have Skills Section (Scorecard Bonus Points) */}
        <div className="field">
          <label>Helpful / Nice-to-Have Skills (Rubric Bonus Points)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
            {niceSkills.map((n, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <div>
                  <b>{n.label}</b>
                  <span className="chip sm" style={{ marginLeft: '8px', background: 'var(--yellow-soft)', color: 'var(--yellow-text)' }}>
                    +{n.w || 10} pts
                  </span>
                  <span className="muted xs" style={{ marginLeft: '8px' }}>
                    Keywords: {n.keys.join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => handleRemoveNiceSkill(idx)}
                  style={{ color: 'var(--red)' }}
                  aria-label="Remove nice skill"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.6fr auto', gap: '8px' }}>
            <input
              type="text"
              placeholder="Skill label (e.g. AWS or Docker)"
              value={newNiceLabel}
              onChange={e => setNewNiceLabel(e.target.value)}
            />
            <input
              type="text"
              placeholder="Keywords (e.g. aws, cloud)"
              value={newNiceKeys}
              onChange={e => setNewNiceKeys(e.target.value)}
            />
            <input
              type="number"
              placeholder="Points"
              title="Bonus score points"
              value={newNiceWeight}
              onChange={e => setNewNiceWeight(Number(e.target.value))}
            />
            <button type="button" className="btn ghost sm" onClick={handleAddNiceSkill}>
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Public Listing Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
          <label className="check" style={{ fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
            />
            <span>Published on Public Careers Site (/careers)</span>
          </label>
          <label className="check" style={{ fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={confidential}
              onChange={e => setConfidential(e.target.checked)}
            />
            <span>Confidential Listing (Hide client identity)</span>
          </label>
          <label className="check" style={{ fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={showSalary}
              onChange={e => setShowSalary(e.target.checked)}
            />
            <span>Display Salary Range on Public Listing</span>
          </label>
        </div>

        {/* Server Error Notification Banner */}
        {serverError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              margin: '10px 0'
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '13px' }}>
              <b style={{ color: 'var(--red)', display: 'block', marginBottom: '2px' }}>Database Sync Notice</b>
              <p style={{ margin: 0, color: 'var(--ink)' }}>{serverError}</p>
              <span className="xs muted" style={{ display: 'block', marginTop: '4px' }}>
                Your edits are safely stored in your local browser cache. Click "Save Changes" again to retry syncing to Neon.
              </span>
            </div>
            <button
              type="button"
              className="linkbtn xs"
              onClick={() => setServerError(null)}
              style={{ color: 'var(--ink-muted)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Actions & Delete Confirmation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn ghost sm"
              style={{ color: 'var(--red)' }}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
            >
              <Trash2 size={14} /> Delete Role
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>
              <span className="xs" style={{ color: 'var(--red)', fontWeight: 600 }}>Confirm delete?</span>
              <button
                type="button"
                className="btn primary sm"
                style={{ background: 'var(--red)' }}
                onClick={handleDelete}
                disabled={isSaving}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="linkbtn xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn ghost" onClick={closeModal} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} />
              {isSaving ? 'Saving to Database...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};
