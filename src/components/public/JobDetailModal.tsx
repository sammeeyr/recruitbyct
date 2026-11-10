import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from '../common/StatusChip';
import { daysDiff, formatDate, formatNaira, getJobStatus } from '../../utils/helpers';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { MapPin, X } from 'lucide-react';

export const JobDetailModal: React.FC = () => {
  const { modal, closeModal, openModal, jobs, clients } = useApp();

  if (!modal || modal.type !== 'job' || modal.mode === 'apply' || modal.mode === 'gform' || modal.mode === 'done') {
    return null;
  }

  const job = jobs.find(j => j.id === modal.id);
  if (!job) return null;

  const client = clients.find(c => c.id === job.clientId);
  const status = getJobStatus(job);
  const isClosedOrFilled = status === 'Filled' || status === 'Closed';

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

      <div className="row" style={{ marginBottom: '10px' }}>
        <StatusChip status={status} />
      </div>

      <h2>{job.title}</h2>
      <p className="muted">
        {job.listing.confidential
          ? `Confidential client · ${client ? client.industry : 'Corporate'}`
          : client?.name}
      </p>

      <ul className="meta" style={{ margin: '14px 0' }}>
        <li>
          <MapPin size={16} />
          {job.location}
        </li>
        <li>{job.type}</li>
        {job.listing.showSalary && (
          <li>
            {formatNaira(job.salary[0])} to {formatNaira(job.salary[1])} a month
          </li>
        )}
        <li>
          {status === 'Filled'
            ? 'Role filled'
            : status === 'Closed'
            ? 'Closed'
            : `Closes ${formatDate(job.closes)} (${daysDiff(job.closes)} days left)`}
        </li>
      </ul>

      {/* Rich Job Description (supports up to 10,000 words with formatting) */}
      <div style={{ margin: '18px 0', padding: '14px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--line)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>Job Description & Overview</h3>
        <RichTextRenderer content={job.summary} />
      </div>

      <h3>What you will do</h3>
      <ul className="ul">
        {job.duties.map((duty, idx) => (
          <li key={idx}>{duty}</li>
        ))}
      </ul>

      <h3>What we look for</h3>
      <ul className="ul">
        {job.must.map((m, idx) => (
          <li key={idx}>{m.label}</li>
        ))}
        <li>{job.minYears}+ years of experience</li>
      </ul>

      <h3>Helpful to have</h3>
      <ul className="ul">
        {job.nice.map((n, idx) => (
          <li key={idx}>{n.label.replace(/\s*\(\+.*/, '')}</li>
        ))}
      </ul>

      <div style={{ marginTop: '26px' }}>
        {isClosedOrFilled ? (
          <div className="banner">
            <b>This role is {status.toLowerCase()}.</b> You can still browse other open
            roles or track an earlier application.
          </div>
        ) : (
          <button
            type="button"
            className="btn primary block"
            onClick={() => openModal({ type: 'job', id: job.id, mode: 'apply' })}
          >
            Apply for this role
          </button>
        )}
      </div>
    </>
  );
};
