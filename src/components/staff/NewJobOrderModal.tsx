import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, LOCATIONS } from '../../data/mockData';
import { addDays } from '../../utils/helpers';
import { X } from 'lucide-react';

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

  if (!modal || modal.type !== 'newjob') return null;

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

      <h2>New job order</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>
        AI drafts the scorecard based on role category and requirements. You review and
        approve it before anything goes live.
      </p>

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
            <label htmlFor="nj-a">Monthly pay from (₦)</label>
            <input
              id="nj-a"
              type="number"
              min="0"
              step="10000"
              required
              value={minPay}
              onChange={e => setMinPay(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="field">
            <label htmlFor="nj-b">Monthly pay to (₦)</label>
            <input
              id="nj-b"
              type="number"
              min="0"
              step="10000"
              required
              value={maxPay}
              onChange={e => setMaxPay(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="nj-y">Minimum years of experience</label>
            <input
              id="nj-y"
              type="number"
              min="0"
              max="30"
              required
              value={minYears}
              onChange={e => setMinYears(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="field">
            <label htmlFor="nj-d">Applications close</label>
            <input
              id="nj-d"
              type="date"
              required
              value={closes}
              onChange={e => setCloses(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn primary block"
          type="submit"
          style={{ marginTop: '16px' }}
        >
          Draft scorecard with AI
        </button>
      </form>
    </>
  );
};
