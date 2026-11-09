import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, LOCATIONS } from '../../data/mockData';
import { addDays, formatNaira } from '../../utils/helpers';
import { X, Sparkles, Wand2 } from 'lucide-react';

export const NewJobOrderModal: React.FC = () => {
  const { modal, closeModal, clients, draftNewJobOrder } = useApp();

  const [clientId, setClientId] = useState(clients[0]?.id || 'c1');
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('Abuja');
  const [cat, setCat] = useState('Customer service');
  const [minPay, setMinPay] = useState(300000);
  const [maxPay, setMaxPay] = useState(450000);
  const [minYears, setMinYears] = useState(3);
  const [closes, setCloses] = useState(addDays(21));

  // AI Prompt Draft Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  if (!modal || (modal.type !== 'newjob' && modal.type !== 'aidraft')) return null;

  const handleAiAutoFill = () => {
    if (!aiPrompt.trim()) return;
    setIsAiDrafting(true);
    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      if (lower.includes('tech') || lower.includes('react') || lower.includes('software') || lower.includes('developer') || lower.includes('python')) {
        setTitle('Senior Full Stack Software Engineer');
        setCat('Technology');
        setMinPay(1000000);
        setMaxPay(1600000);
        setMinYears(4);
      } else if (lower.includes('finance') || lower.includes('account') || lower.includes('audit')) {
        setTitle('Finance & Compliance Officer');
        setCat('Finance');
        setMinPay(450000);
        setMaxPay(700000);
        setMinYears(3);
      } else if (lower.includes('sales') || lower.includes('business development') || lower.includes('fmcg')) {
        setTitle('Enterprise Business Development Manager');
        setCat('Sales');
        setMinPay(400000);
        setMaxPay(650000);
        setMinYears(3);
      } else if (lower.includes('lead') || lower.includes('manager') || lower.includes('supervisor')) {
        setTitle('Customer Support Team Lead');
        setCat('Customer service');
        setMinPay(450000);
        setMaxPay(650000);
        setMinYears(4);
      } else {
        setTitle(aiPrompt.trim().replace(/^draft a /i, '').replace(/^new role /i, ''));
      }

      if (lower.includes('lagos')) setLoc('Lagos');
      else if (lower.includes('abuja')) setLoc('Abuja');
      else if (lower.includes('remote')) setLoc('Remote');
      else if (lower.includes('ph') || lower.includes('port harcourt')) setLoc('Port Harcourt');

      setIsAiDrafting(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    draftNewJobOrder({
      clientId,
      title: title.trim(),
      loc,
      cat,
      minPay: Number(minPay),
      maxPay: Number(maxPay),
      minYears: Number(minYears),
      closes
    });
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span className="chip warn" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} /> AI Job Role Assistant
        </span>
      </div>

      <h2>New Job Order</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>
        AI drafts the scorecard and duties based on your role specifications. Newly drafted roles require ₦10,000 listing fee before live publication.
      </p>

      {/* AI Prompt Draft Box */}
      <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Wand2 size={14} style={{ color: 'var(--yellow)' }} />
          <b style={{ fontSize: '13px' }}>AI Natural Language Role Drafter</b>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. Lead React Developer in Lagos, min 4 yrs exp, ₦1.2M pay..."
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
        <div className="field">
          <label htmlFor="nj-c">Client</label>
          <select
            id="nj-c"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            required
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="nj-t">Job title</label>
          <input
            id="nj-t"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Operations Supervisor, React Lead, Account Manager"
          />
        </div>

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

        <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <button type="button" className="btn ghost" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn primary block">
            Draft with AI scorecard
          </button>
        </div>
      </form>
    </>
  );
};
