import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StaffShell } from './StaffShell';
import { StatusChip } from '../common/StatusChip';
import { formatDate, getJobStatus, formatNaira } from '../../utils/helpers';
import {
  Plus,
  Sparkles,
  UploadCloud,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Kanban,
  CheckCircle2,
  Users,
  Copy,
  Link2,
  Globe
} from 'lucide-react';
import { LinkedinIcon } from '../common/LinkedinIcon';
import { getJobApplicationUrl } from '../../utils/helpers';

export const JobOrdersView: React.FC = () => {
  const { jobs, clients, applications, openModal, deleteJobOrder, setPipeJobId, navigate, showToast } = useApp();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'draft' | 'needs-approval' | 'closed'>('all');

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      // Status filter
      if (statusFilter === 'draft' && j.state !== 'draft') return false;
      if (statusFilter === 'open' && (j.state !== 'open' || !j.listing.published)) return false;
      if (statusFilter === 'needs-approval' && j.approved) return false;
      if (statusFilter === 'closed' && j.state !== 'closed' && j.state !== 'filled') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = clients.find(c => c.id === j.clientId);
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchClient = client?.name.toLowerCase().includes(q) || false;
        const matchLocation = j.location.toLowerCase().includes(q);
        const matchCategory = j.category.toLowerCase().includes(q);
        if (!matchTitle && !matchClient && !matchLocation && !matchCategory) return false;
      }

      return true;
    });
  }, [jobs, clients, statusFilter, searchQuery]);

  const handleOpenPipeline = (jobId: string) => {
    setPipeJobId(jobId);
    navigate('pipeline');
  };

  return (
    <StaffShell
      title="Job Orders & Roles"
      sub="Create, edit, AI-draft, and manage client recruitment roles and scorecards."
      actions={
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openModal({ type: 'job-channels' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981' }}
          >
            <Globe size={15} /> 2,500+ Job Channels & Sponsored Ads
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openModal({ type: 'linkedin-jobs' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <LinkedinIcon size={15} style={{ color: '#0A66C2' }} /> LinkedIn Managed
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => openModal({ type: 'resume-import' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <UploadCloud size={15} style={{ color: 'var(--yellow)' }} /> Import & Screen Resumes
          </button>
          <button
            type="button"
            className="btn yellow sm"
            onClick={() => openModal({ type: 'aidraft' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Sparkles size={15} /> AI Draft Role
          </button>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => openModal({ type: 'newjob' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={15} /> {user.role === 'agency_admin' ? 'Create Job for Client' : 'New Job Order'}
          </button>
        </div>
      }
    >
      {/* Search & Status Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Roles ({jobs.length})
          </button>
          <button
            type="button"
            className={`pill ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            Open & Live ({jobs.filter(j => j.state === 'open' && j.listing.published).length})
          </button>
          <button
            type="button"
            className={`pill ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Drafts ({jobs.filter(j => j.state === 'draft').length})
          </button>
          <button
            type="button"
            className={`pill ${statusFilter === 'needs-approval' ? 'active' : ''}`}
            onClick={() => setStatusFilter('needs-approval')}
          >
            Needs Approval ({jobs.filter(j => !j.approved).length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search roles, clients, or locations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
          />
        </div>
      </div>

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Client</th>
              <th>Pay Range</th>
              <th>Status</th>
              <th>Scorecard</th>
              <th className="num">Applicants</th>
              <th className="num">Closes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No job orders matching your filters.
                </td>
              </tr>
            ) : (
              filteredJobs.map(j => {
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
                        {j.location} · {j.type} · {j.category}
                      </div>
                    </td>
                    <td>{client?.name || 'Cube Tech Client'}</td>
                    <td className="mono xs">
                      {formatNaira(j.salary[0])} - {formatNaira(j.salary[1])}
                    </td>
                    <td>
                      {j.state === 'draft' ? (
                        <span className="chip red">Draft</span>
                      ) : (
                        <StatusChip status={status} />
                      )}
                    </td>
                    <td>
                      {j.approved ? (
                        <span className="chip good">Approved</span>
                      ) : (
                        <span className="chip warn">Needs approval</span>
                      )}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        onClick={() => openModal({ type: 'applicants', jobId: j.id })}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: applicantCount > 0 ? 'rgba(10, 102, 194, 0.1)' : 'var(--surface-2)',
                          color: applicantCount > 0 ? '#0A66C2' : 'var(--muted)',
                          border: applicantCount > 0 ? '1px solid rgba(10, 102, 194, 0.3)' : '1px solid var(--line)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`Manage ${applicantCount} applicants`}
                      >
                        <Users size={12} /> {applicantCount}
                      </button>
                    </td>
                    <td className="num">{j.state === 'draft' ? '—' : formatDate(j.closes)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Manage Applicants"
                          onClick={() => openModal({ type: 'applicants', jobId: j.id })}
                          style={{ padding: '5px', color: '#0A66C2' }}
                        >
                          <Users size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Copy Shareable Job URL"
                          onClick={() => {
                            const url = getJobApplicationUrl(j);
                            navigator.clipboard.writeText(url);
                            showToast(`Copied application link: ${url}`);
                          }}
                          style={{ padding: '5px' }}
                        >
                          <Link2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Edit Role & AI Polish"
                          onClick={() => openModal({ type: 'editjob', id: j.id })}
                          style={{ padding: '5px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Import & Screen Resumes"
                          onClick={() => openModal({ type: 'resume-import', jobId: j.id })}
                          style={{ padding: '5px', color: 'var(--yellow)' }}
                        >
                          <UploadCloud size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Share on LinkedIn"
                          onClick={() => openModal({ type: 'share-linkedin', jobId: j.id })}
                          style={{ padding: '5px', color: '#0A66C2' }}
                        >
                          <LinkedinIcon size={14} style={{ color: '#0A66C2' }} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Post to 2,500+ Job Channels & Sponsored Ads"
                          onClick={() => openModal({ type: 'job-channels', jobId: j.id })}
                          style={{ padding: '5px', color: '#10B981' }}
                        >
                          <Globe size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Open Pipeline"
                          onClick={() => handleOpenPipeline(j.id)}
                          style={{ padding: '5px' }}
                        >
                          <Kanban size={14} />
                        </button>
                        <button
                          type="button"
                          className="iconbtn"
                          title="Delete Role"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete role '${j.title}'?`)) {
                              deleteJobOrder(j.id);
                            }
                          }}
                          style={{ padding: '5px', color: 'var(--red)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
