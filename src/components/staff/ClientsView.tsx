import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StaffShell } from './StaffShell';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Briefcase,
  Percent,
  Filter,
  Award
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const { clients, jobs, placements, setSelectedClientId, navigate, openModal, deleteClient } = useApp();
  const { user, hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Recruiter Agency CRUD permissions
  const canManageClients =
    hasPermission('manage_clients') ||
    user.role === 'recruiter' ||
    user.role === 'agency_admin' ||
    user.role === 'admin';

  // Industries available for filtering
  const industries = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set).sort();
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.contactEmail && c.contactEmail.toLowerCase().includes(q));

      const matchIndustry =
        selectedIndustry === 'all' ||
        c.industry.toLowerCase() === selectedIndustry.toLowerCase();

      return matchSearch && matchIndustry;
    });
  }, [clients, search, selectedIndustry]);

  // Overall KPIs
  const totalOpenJobs = useMemo(() => {
    return jobs.filter(j => j.state === 'open').length;
  }, [jobs]);

  const totalPlacementsCount = placements.length;
  const avgFee = useMemo(() => {
    if (clients.length === 0) return 15;
    const sum = clients.reduce((acc, c) => acc + (Number(c.fee) || 15), 0);
    return Math.round((sum / clients.length) * 10) / 10;
  }, [clients]);

  const handlePreviewPortal = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate('client-portal');
  };

  const handleEditClient = (clientId: string) => {
    openModal({ type: 'client', clientId });
  };

  const handleAddClient = () => {
    openModal({ type: 'client' });
  };

  const handlePostJobForClient = (clientId: string) => {
    openModal({ type: 'newjob', clientId });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete corporate client '${clientName}'? Associated job orders and placements will be unlinked.`)) {
      setDeletingId(clientId);
      try {
        await deleteClient(clientId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <StaffShell
      title="Corporate Clients"
      sub="Manage client employer relationships, fee terms, guarantee periods, and portal access."
      actions={
        canManageClients && (
          <button
            type="button"
            className="btn"
            onClick={handleAddClient}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Add Corporate Client</span>
          </button>
        )
      }
    >
      {/* KPI Stats Bar */}
      <div className="kpis" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Active Clients</span>
            <Building2 size={18} style={{ color: 'var(--red)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{clients.length}</div>
          <p className="xs muted" style={{ margin: '4px 0 0' }}>Corporate employers onboarded</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Open Job Orders</span>
            <Briefcase size={18} style={{ color: 'var(--yellow)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{totalOpenJobs}</div>
          <p className="xs muted" style={{ margin: '4px 0 0' }}>Across all client pipelines</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Total Placements</span>
            <Award size={18} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{totalPlacementsCount}</div>
          <p className="xs muted" style={{ margin: '4px 0 0' }}>Successful candidate hires</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Average Fee</span>
            <Percent size={18} style={{ color: '#A855F7' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>{avgFee}%</div>
          <p className="xs muted" style={{ margin: '4px 0 0' }}>First-year placement revenue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          marginBottom: '20px'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--muted)' }}
          />
          <input
            type="search"
            placeholder="Search clients by company, industry, or hiring contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} style={{ color: 'var(--muted)' }} />
          <select
            value={selectedIndustry}
            onChange={e => setSelectedIndustry(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontSize: '13px'
            }}
          >
            <option value="all">All Industries ({clients.length})</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {(search || selectedIndustry !== 'all') && (
          <button
            type="button"
            className="linkbtn xs"
            onClick={() => {
              setSearch('');
              setSelectedIndustry('all');
            }}
            style={{ color: 'var(--muted)' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Building2 size={44} style={{ color: 'var(--muted)', marginBottom: '14px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 6px' }}>No clients found</h3>
          <p className="muted" style={{ maxWidth: '420px', margin: '0 auto 16px', fontSize: '13px' }}>
            {search || selectedIndustry !== 'all'
              ? 'No corporate clients matched your search filters. Try adjusting your query.'
              : 'You have not onboarded any client employers yet. Add your first corporate client to start posting job orders and tracking placement fees.'}
          </p>
          {canManageClients && (
            <button type="button" className="btn sm" onClick={handleAddClient}>
              <Plus size={15} style={{ marginRight: '6px' }} />
              Add Corporate Client
            </button>
          )}
        </div>
      ) : (
        <div className="jobs">
          {filteredClients.map(c => {
            const clientJobs = jobs.filter(j => j.clientId === c.id);
            const clientPlacements = placements.filter(p => p.clientId === c.id);
            const openCount = clientJobs.filter(j => j.state === 'open').length;
            const contactEmail = c.contactEmail || c.email;
            const contactPhone = c.contactPhone || c.phone;

            return (
              <article
                key={c.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Top Row: Industry badge & Quick Portal Link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    className="xs caps"
                    style={{
                      letterSpacing: '.08em',
                      fontWeight: 700,
                      background: 'rgba(230, 57, 70, 0.12)',
                      color: 'var(--red)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {c.industry || 'Corporate'}
                  </span>

                  <button
                    type="button"
                    className="linkbtn xs"
                    onClick={() => handlePreviewPortal(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--muted)',
                      fontSize: '11px'
                    }}
                    title="Preview Client Portal"
                  >
                    <span>Portal</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                {/* Company Name */}
                <h3 style={{ fontSize: '24px', margin: '2px 0 12px', fontWeight: 800 }}>
                  {c.name}
                </h3>

                {/* Commercial Terms Summary Banner */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <span className="xs muted" style={{ display: 'block', fontSize: '11px' }}>Placement Fee</span>
                    <b style={{ color: 'var(--yellow)', fontSize: '14px' }}>
                      {c.fee}% <span className="xs" style={{ fontWeight: 400 }}>1st-yr base</span>
                    </b>
                  </div>
                  <div>
                    <span className="xs muted" style={{ display: 'block', fontSize: '11px' }}>Guarantee Window</span>
                    <b style={{ color: '#10B981', fontSize: '14px' }}>
                      {c.guarantee} <span className="xs" style={{ fontWeight: 400 }}>days</span>
                    </b>
                  </div>
                </div>

                {/* Key Value Details */}
                <dl className="kv" style={{ marginBottom: '16px' }}>
                  <dt>Hiring contact</dt>
                  <dd style={{ fontWeight: 600 }}>{c.contact}</dd>

                  {contactEmail && (
                    <>
                      <dt>Email</dt>
                      <dd>
                        <a
                          href={`mailto:${contactEmail}`}
                          style={{ color: 'var(--red)', textDecoration: 'none', wordBreak: 'break-all' }}
                        >
                          {contactEmail}
                        </a>
                      </dd>
                    </>
                  )}

                  {contactPhone && (
                    <>
                      <dt>Phone</dt>
                      <dd>
                        <a href={`tel:${contactPhone}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                          {contactPhone}
                        </a>
                      </dd>
                    </>
                  )}

                  <dt>Open job orders</dt>
                  <dd>
                    <b style={{ color: openCount > 0 ? 'var(--yellow)' : 'var(--muted)' }}>
                      {openCount}
                    </b>{' '}
                    <span className="muted xs">({clientJobs.length} total)</span>
                  </dd>

                  <dt>Placements</dt>
                  <dd>
                    <b style={{ color: clientPlacements.length > 0 ? '#10B981' : 'var(--muted)' }}>
                      {clientPlacements.length}
                    </b>
                  </dd>
                </dl>

                {/* Action Buttons Toolbar */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {canManageClients && (
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => handlePostJobForClient(c.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '12px' }}
                        title="Create a new job order for this client"
                      >
                        <Briefcase size={13} />
                        <span>Post Job</span>
                      </button>
                    )}

                    {canManageClients && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => handleEditClient(c.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '12px' }}
                        title="Edit client terms and contacts"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => handlePreviewPortal(c.id)}
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Preview their candidate portal"
                    >
                      Portal
                    </button>

                    {canManageClients && (
                      <button
                        type="button"
                        className="iconbtn"
                        onClick={() => handleDeleteClient(c.id, c.name)}
                        disabled={deletingId === c.id}
                        style={{
                          color: 'var(--red)',
                          padding: '6px',
                          border: '1px solid rgba(230, 57, 70, 0.25)',
                          borderRadius: '6px'
                        }}
                        title={`Delete client ${c.name}`}
                        aria-label={`Delete client ${c.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </StaffShell>
  );
};
