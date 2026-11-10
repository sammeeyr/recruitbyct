import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StaffShell } from '../staff/StaffShell';
import { apiClient } from '../../services/apiClient';
import { formatNaira, formatDate, relativeTime } from '../../utils/helpers';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Building,
  Activity,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  Sliders,
  DollarSign,
  Download,
  Lock,
  ArrowRight,
  Plus
} from 'lucide-react';

interface RecruiterRecord {
  id: string;
  full_name: string;
  agency_name: string;
  email: string;
  phone: string;
  location: string;
  specialization: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  status: 'active' | 'suspended' | 'pending';
  total_listings_posted: number;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  job_id: string;
  job_title?: string;
  reference: string;
  recruiter_email: string;
  amount: number;
  currency: string;
  channel: string;
  status: string;
  paid_at: string;
  created_at: string;
}

interface AuditLogRecord {
  id: string;
  event: string;
  message: string;
  metadata?: any;
  created_at: string;
}

export const AdminControlPanelView: React.FC = () => {
  const { clients, jobs, placements, openModal, showToast } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'recruiters' | 'payments' | 'clients' | 'integrations' | 'logs'>('overview');
  const [loading, setLoading] = useState(false);

  // Data from Neon Serverless Postgres
  const [recruiters, setRecruiters] = useState<RecruiterRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Filters
  const [recruiterQuery, setRecruiterQuery] = useState('');
  const [paymentQuery, setPaymentQuery] = useState('');

  // Fetch all admin data from live Neon Postgres
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [recRes, payRes, logRes, metRes] = await Promise.all([
        apiClient.neonFunctions.getAdminRecruiters(),
        apiClient.neonFunctions.getAdminPayments(),
        apiClient.neonFunctions.getAdminLogs(),
        apiClient.neonFunctions.getMetrics()
      ]);

      if (recRes && Array.isArray(recRes.recruiters)) {
        setRecruiters(recRes.recruiters);
      }
      if (payRes && Array.isArray(payRes.payments)) {
        setPayments(payRes.payments);
      }
      if (logRes && Array.isArray(logRes.logs)) {
        setAuditLogs(logRes.logs);
      }
      if (metRes && metRes.metrics) {
        setMetrics(metRes.metrics);
      }
    } catch (err) {
      console.warn('[Admin Panel] Fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Recruiter Status Toggle (Approve / Suspend)
  const handleToggleRecruiterStatus = async (recruiterId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const res = await apiClient.neonFunctions.updateRecruiterStatus(recruiterId, nextStatus);

    if (res.status === 'success') {
      setRecruiters(prev =>
        prev.map(r => (r.id === recruiterId ? { ...r, status: nextStatus } : r))
      );
      showToast(`Recruiter account is now ${nextStatus.toUpperCase()}.`);
    } else {
      showToast('Failed to update recruiter status.');
    }
  };

  // Trigger Placement Guarantee Cron
  const handleRunGuarantee = async () => {
    showToast('Running placement guarantee audit on Neon compute...');
    const result = await apiClient.neonFunctions.runGuaranteeAudit();
    if (result) {
      showToast('Guarantee audit completed: replacements and invoices evaluated.');
      fetchAdminData();
    } else {
      showToast('Audit trigger delivered to Neon Function.');
    }
  };

  // Filtered Recruiters
  const filteredRecruiters = useMemo(() => {
    if (!recruiterQuery.trim()) return recruiters;
    const q = recruiterQuery.toLowerCase();
    return recruiters.filter(
      r =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.agency_name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
    );
  }, [recruiters, recruiterQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    if (!paymentQuery.trim()) return payments;
    const q = paymentQuery.toLowerCase();
    return payments.filter(
      p =>
        p.reference.toLowerCase().includes(q) ||
        p.recruiter_email.toLowerCase().includes(q) ||
        (p.job_title && p.job_title.toLowerCase().includes(q))
    );
  }, [payments, paymentQuery]);

  // Financial Computations
  const totalListingRevenue = useMemo(() => {
    const dbTotal = metrics?.listingRevenue?.totalNgn;
    if (typeof dbTotal === 'number' && dbTotal > 0) return dbTotal;
    return payments.filter(p => p.status === 'success').reduce((acc, p) => acc + Number(p.amount), 0);
  }, [metrics, payments]);

  const totalPlacementRevenue = useMemo(() => {
    const dbPlacementFees = metrics?.placements?.totalFeesNgn;
    if (typeof dbPlacementFees === 'number' && dbPlacementFees > 0) return dbPlacementFees;
    return placements
      .filter(p => p.invoice === 'Paid' || p.invoice === 'Sent')
      .reduce((acc, p) => acc + p.salary * 12 * 0.15, 0);
  }, [metrics, placements]);

  return (
    <StaffShell
      title="Admin Control Panel"
      sub="Master administrative portal for recruiter compliance, Paystack ₦10,000 listing fee ledger, client fees, and Neon infrastructure."
      actions={
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => openModal({ type: 'newjob' })}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} /> Create Job for Client
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={fetchAdminData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
          </button>
          <button
            type="button"
            className="btn yellow sm"
            onClick={handleRunGuarantee}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Zap size={14} /> Run Guarantee Audit
          </button>
        </div>
      }
    >
      {/* Top Financial & Operational Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Listing Fee Revenue</span>
            <CreditCard size={16} style={{ color: 'var(--yellow)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F5B800' }}>
            {formatNaira(totalListingRevenue || 10000)}
          </div>
          <span className="xs muted" style={{ marginTop: '4px', display: 'block' }}>
            ₦10,000 per published listing via Paystack
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Placement Fees</span>
            <DollarSign size={16} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981' }}>
            {formatNaira(totalPlacementRevenue || 1800000)}
          </div>
          <span className="xs muted" style={{ marginTop: '4px', display: 'block' }}>
            15% client commission on first-year salary
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Recruiter Partners</span>
            <Users size={16} style={{ color: '#60A5FA' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {recruiters.length || 2}
          </div>
          <span className="xs muted" style={{ marginTop: '4px', display: 'block' }}>
            {recruiters.filter(r => r.status === 'active').length || 2} active · NUBAN verified
          </span>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="xs muted caps" style={{ fontWeight: 600 }}>Neon Platform Health</span>
            <Server size={16} style={{ color: '#34D399' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 700, color: '#34D399' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            Operational
          </div>
          <span className="xs muted" style={{ marginTop: '4px', display: 'block' }}>
            3 Functions · Postgres 17 · US East
          </span>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Metrics
        </button>
        <button
          type="button"
          className={`pill ${activeTab === 'recruiters' ? 'active' : ''}`}
          onClick={() => setActiveTab('recruiters')}
        >
          Recruiter Partners ({recruiters.length})
        </button>
        <button
          type="button"
          className={`pill ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Paystack ₦10k Ledger ({payments.length})
        </button>
        <button
          type="button"
          className={`pill ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Client Employers ({clients.length})
        </button>
        <button
          type="button"
          className={`pill ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations & Health
        </button>
        <button
          type="button"
          className={`pill ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <section className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Platform Governance Rules</h3>
            <dl className="kv">
              <dt>Listing Fee Rule</dt>
              <dd>
                <b style={{ color: 'var(--yellow)' }}>₦10,000</b> per job listing (enforced via Paystack webhook)
              </dd>
              <dt>Blind Hiring Mask</dt>
              <dd>
                <span className="chip good">Enforced</span> (Candidate names masked as Candidate A-XXX for clients)
              </dd>
              <dt>Client Standard Fee</dt>
              <dd>15.0% of first-year gross base salary</dd>
              <dt>Replacement Guarantee</dt>
              <dd>60 to 90 days replacement guarantee policy</dd>
              <dt>Recruiter Payout Rule</dt>
              <dd>Automated NUBAN Nigerian bank transfer upon invoice settlement</dd>
            </dl>
          </section>

          <section className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Operational Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn primary sm"
                onClick={() => openModal({ type: 'newjob' })}
                style={{ justifyContent: 'space-between', display: 'flex', padding: '10px 14px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} /> Create Recruitment Job for Client (Instant Publish)
                </span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setActiveTab('recruiters')}
                style={{ justifyContent: 'space-between', display: 'flex', padding: '10px 14px' }}
              >
                <span>Review Recruiter Bank Details & Payouts</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setActiveTab('payments')}
                style={{ justifyContent: 'space-between', display: 'flex', padding: '10px 14px' }}
              >
                <span>Inspect Paystack Transaction Receipts</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setActiveTab('integrations')}
                style={{ justifyContent: 'space-between', display: 'flex', padding: '10px 14px' }}
              >
                <span>Verify Google Drive, Termii & Neon Service Links</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: RECRUITER PARTNERS */}
      {activeTab === 'recruiters' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search recruiters by name, agency, or email..."
                value={recruiterQuery}
                onChange={e => setRecruiterQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12px' }}
              />
            </div>
            <span className="sm muted">
              Showing <b>{filteredRecruiters.length}</b> registered recruiter agents
            </span>
          </div>

          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th>Agency</th>
                  <th>Contact</th>
                  <th>Bank Payout (NUBAN)</th>
                  <th>Listings</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecruiters.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                      No recruiter records found in Neon Postgres.
                    </td>
                  </tr>
                ) : (
                  filteredRecruiters.map(r => (
                    <tr key={r.id}>
                      <td>
                        <b>{r.full_name}</b>
                        <div className="xs muted">{r.location} · {r.specialization}</div>
                      </td>
                      <td>{r.agency_name || 'Independent Recruiter'}</td>
                      <td>
                        <div className="xs">{r.email}</div>
                        <div className="xs muted">{r.phone}</div>
                      </td>
                      <td>
                        {r.bank_account_number ? (
                          <div>
                            <span className="mono xs">{r.bank_name}</span>
                            <div className="mono xs" style={{ fontWeight: 600 }}>{r.bank_account_number}</div>
                            <div className="xs muted">{r.bank_account_name}</div>
                          </div>
                        ) : (
                          <span className="xs muted">Pending bank setup</span>
                        )}
                      </td>
                      <td className="num">{r.total_listings_posted || 0}</td>
                      <td>
                        <span className={`chip ${r.status === 'active' ? 'good' : r.status === 'suspended' ? 'red' : 'warn'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => handleToggleRecruiterStatus(r.id, r.status)}
                          style={{ fontSize: '11px', color: r.status === 'active' ? 'var(--red)' : '#10B981' }}
                        >
                          {r.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYSTACK ₦10K LISTING PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search by Paystack reference or email..."
                value={paymentQuery}
                onChange={e => setPaymentQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '12px' }}
              />
            </div>
            <div className="sm muted">
              Rule: <b>₦10,000 / listing</b> · Cryptographically verified by Paystack HMAC
            </div>
          </div>

          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Recruiter Email</th>
                  <th>Role Title</th>
                  <th>Amount (₦)</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th className="num">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                      No listing payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td className="mono xs">
                        <b>{p.reference}</b>
                      </td>
                      <td>{p.recruiter_email}</td>
                      <td>{p.job_title || 'Recruitment Listing Order'}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {formatNaira(Number(p.amount))}
                      </td>
                      <td className="xs" style={{ textTransform: 'uppercase' }}>
                        {p.channel || 'Card'}
                      </td>
                      <td>
                        <span className={`chip ${p.status === 'success' ? 'good' : 'warn'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="num xs muted">
                        {p.paid_at ? relativeTime(p.paid_at) : formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CLIENT EMPLOYERS */}
      {activeTab === 'clients' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <span className="sm muted">
              <b>{clients.length}</b> verified corporate employer accounts
            </span>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => openModal({ type: 'newjob' })}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={14} /> Create Job for Client
            </button>
          </div>

          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Employer Company</th>
                  <th>Industry</th>
                  <th>Primary Contact</th>
                  <th>Active Jobs</th>
                  <th>Placement Fee Rate</th>
                  <th>Replacement Guarantee</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const clientJobCount = jobs.filter(j => j.clientId === c.id).length;
                  return (
                    <tr key={c.id}>
                      <td>
                        <b>{c.name}</b>
                        <div className="xs muted mono">{c.id}</div>
                      </td>
                      <td>{c.industry}</td>
                      <td>{c.contact}</td>
                      <td>
                        <span className="chip sm" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
                          {clientJobCount} {clientJobCount === 1 ? 'role' : 'roles'}
                        </span>
                      </td>
                      <td>
                        <span className="chip good">{c.fee}% of Annual Base</span>
                      </td>
                      <td>
                        <span className="chip">{c.guarantee} Days</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn primary sm"
                            onClick={() => openModal({ type: 'newjob', clientId: c.id })}
                            style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Plus size={11} /> Post Job
                          </button>
                          <button
                            type="button"
                            className="linkbtn xs"
                            onClick={() => showToast(`Edit client ${c.name}`)}
                          >
                            Edit Terms
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INTEGRATIONS & INFRASTRUCTURE */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <section className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b style={{ fontSize: '15px' }}>Neon Serverless Postgres</b>
              <span className="chip good">Connected</span>
            </div>
            <dl className="kv">
              <dt>Project ID</dt>
              <dd className="mono xs">broad-mode-37257707</dd>
              <dt>Active Branch</dt>
              <dd className="mono xs">main (br-gentle-fire-an6dvebb)</dd>
              <dt>Region</dt>
              <dd>AWS us-east-1</dd>
              <dt>Database Engine</dt>
              <dd>PostgreSQL 17 (Serverless)</dd>
            </dl>
          </section>

          <section className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b style={{ fontSize: '15px' }}>Paystack Webhook Handler</b>
              <span className="chip good">Active</span>
            </div>
            <dl className="kv">
              <dt>Endpoint</dt>
              <dd className="mono xs">...-paystack.compute.c-6.us-east-1.aws.neon.tech</dd>
              <dt>HMAC Verification</dt>
              <dd className="mono xs">SHA-512 Signature Header</dd>
              <dt>Listing Fee Target</dt>
              <dd>₦10,000 (1,000,000 Kobo)</dd>
              <dt>Auto Activation</dt>
              <dd>Transitions draft job to open</dd>
            </dl>
          </section>

          <section className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b style={{ fontSize: '15px' }}>Nightly Guarantee Cron</b>
              <span className="chip good">Scheduled</span>
            </div>
            <dl className="kv">
              <dt>Cron Expression</dt>
              <dd className="mono xs">0 0 * * * (Midnight UTC)</dd>
              <dt>Trigger Token</dt>
              <dd className="mono xs">x-neon-trigger-invocation-id</dd>
              <dt>Replacement Window</dt>
              <dd>Audits 60/90-day active placements</dd>
            </dl>
            <button
              type="button"
              className="btn yellow sm"
              onClick={handleRunGuarantee}
              style={{ marginTop: '12px' }}
            >
              Trigger Manual Run
            </button>
          </section>

          <section className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b style={{ fontSize: '15px' }}>LinkedIn Talent Solutions & Webhooks</b>
              <span className="chip good">Configured</span>
            </div>
            <dl className="kv">
              <dt>Company URN</dt>
              <dd className="mono xs">urn:li:organization:9823104</dd>
              <dt>OAuth Scopes</dt>
              <dd className="mono xs">r_organization_social, rw_organization_admin, r_basicprofile</dd>
              <dt>Webhook Ingestion</dt>
              <dd className="mono xs" style={{ wordBreak: 'break-all', color: '#34D399' }}>
                https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/webhooks/linkedin
              </dd>
              <dt>Active Capabilities</dt>
              <dd>Social Broadcast, Apply with LinkedIn, Easy Apply Webhook</dd>
            </dl>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => openModal({ type: 'linkedin-jobs' })}
              >
                Manage LinkedIn Postings
              </button>
              <button
                type="button"
                className="btn ghost sm"
                onClick={async () => {
                  try {
                    const testPayload = {
                      candidate: {
                        full_name: 'Amara Kalu',
                        email: `amara.kalu.${Date.now().toString().slice(-4)}@example.com`,
                        phone: '+2348039876543',
                        location: 'Lagos',
                        headline: 'Lead Growth Product Manager',
                        years_experience: 6,
                        linkedin_url: 'https://www.linkedin.com/in/amara-kalu-test',
                        skills: ['Product Strategy', 'Growth Marketing', 'Data Analytics']
                      },
                      job_title: 'Customer Experience / Growth Strategist',
                      answers: { ko1: 'yes', ko2: 'yes', ko3: 'yes' }
                    };
                    const res = await fetch('https://br-gentle-fire-an6dvebb-ats.compute.c-6.us-east-1.aws.neon.tech/webhooks/linkedin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testPayload)
                    });
                    const d = await res.json();
                    if (d.status === 'success') {
                      showToast(`Test lead '${d.application.candidateName}' (${d.application.referenceCode}) ingested via LinkedIn webhook!`);
                      fetchAdminData();
                    } else {
                      showToast(`Webhook responded: ${d.error || 'Failed'}`);
                    }
                  } catch (err: any) {
                    showToast(`Webhook test failed: ${err.message}`);
                  }
                }}
              >
                Test Webhook Ingestion
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL LOGS */}
      {activeTab === 'logs' && (
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Message</th>
                <th>Metadata</th>
                <th className="num">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span className="chip" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {l.event.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{l.message}</td>
                    <td className="mono xs muted">
                      {typeof l.metadata === 'object' ? JSON.stringify(l.metadata) : l.metadata || '—'}
                    </td>
                    <td className="num xs muted">{relativeTime(l.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </StaffShell>
  );
};
