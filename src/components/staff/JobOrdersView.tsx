import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { StatusChip } from '../common/StatusChip';
import { formatDate, getJobStatus } from '../../utils/helpers';
import { Plus } from 'lucide-react';

export const JobOrdersView: React.FC = () => {
  const { jobs, clients, applications, openModal } = useApp();

  return (
    <StaffShell
      title="Job orders"
      sub="Publish a job order as a listing once its scorecard is approved."
      actions={
        <button
          type="button"
          className="btn primary"
          onClick={() => openModal({ type: 'newjob' })}
        >
          <Plus size={16} /> New job order
        </button>
      }
    >
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Client</th>
              <th>Status</th>
              <th>Public listing</th>
              <th>Scorecard</th>
              <th className="num">Applicants</th>
              <th className="num">Closes</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => {
              const client = clients.find(c => c.id === j.clientId);
              const applicantCount = applications.filter(a => a.jobId === j.id).length;
              const status = getJobStatus(j);

              return (
                <tr key={j.id}>
                  <td>
                    <button
                      type="button"
                      className="name"
                      onClick={() => openModal({ type: 'jo', id: j.id })}
                    >
                      {j.title}
                    </button>
                    <div className="muted xs">
                      {j.location} · {j.type}
                    </div>
                  </td>
                  <td>{client?.name}</td>
                  <td>
                    {j.state === 'draft' ? (
                      <span className="chip red">Draft</span>
                    ) : (
                      <StatusChip status={status} />
                    )}
                  </td>
                  <td>
                    {j.listing.published && j.state !== 'draft' ? (
                      <span className="chip good">Published</span>
                    ) : (
                      <span className="chip">Not published</span>
                    )}
                  </td>
                  <td>
                    {j.approved ? (
                      <span className="chip good">Approved</span>
                    ) : (
                      <span className="chip warn">Needs approval</span>
                    )}
                  </td>
                  <td className="num">{applicantCount}</td>
                  <td className="num">{j.state === 'draft' ? '—' : formatDate(j.closes)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
