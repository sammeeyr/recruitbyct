import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';

export const ClientsView: React.FC = () => {
  const { clients, jobs, placements, setSelectedClientId, navigate } = useApp();

  const handlePreviewPortal = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate('client-portal');
  };

  return (
    <StaffShell
      title="Clients"
      sub="Fee terms and guarantee periods set the financial side of every placement."
    >
      <div className="jobs">
        {clients.map(c => {
          const clientJobs = jobs.filter(j => j.clientId === c.id);
          const clientPlacements = placements.filter(p => p.clientId === c.id);
          const openCount = clientJobs.filter(j => j.state === 'open').length;

          return (
            <article key={c.id} className="card">
              <p
                className="xs muted caps"
                style={{ letterSpacing: '.12em', fontWeight: 600 }}
              >
                {c.industry}
              </p>

              <h3 style={{ fontSize: '28px', margin: '4px 0 8px' }}>{c.name}</h3>

              <dl className="kv">
                <dt>Hiring contact</dt>
                <dd>{c.contact}</dd>

                <dt>Placement fee</dt>
                <dd>{c.fee}% of first-year salary</dd>

                <dt>Guarantee</dt>
                <dd>{c.guarantee} days</dd>

                <dt>Open job orders</dt>
                <dd>{openCount}</dd>

                <dt>Placements</dt>
                <dd>{clientPlacements.length}</dd>
              </dl>

              <p style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => handlePreviewPortal(c.id)}
                >
                  Preview their portal
                </button>
              </p>
            </article>
          );
        })}
      </div>
    </StaffShell>
  );
};
