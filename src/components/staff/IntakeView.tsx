import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { STAGE_LABELS } from '../../utils/helpers';
import { Inbox, CheckCircle2, Cloud, FileSpreadsheet, MessageSquare, CreditCard } from 'lucide-react';

export const IntakeView: React.FC = () => {
  const {
    jobs,
    applications,
    candidates,
    driveConnected,
    sheetLogging,
    toggleSheetLogging,
    pullGoogleFormBatch,
    navigate
  } = useApp();

  const publishedRoles = jobs.filter(j => j.listing.published && j.state !== 'draft');
  const googleFormResponsesCount = applications.filter(
    a => a.source === 'Google Form'
  ).length;

  const recentApplications = applications.slice(0, 6);

  return (
    <StaffShell
      title="Multi-Channel Intake & Integrations"
      sub="Every application, from any channel, lands in the central ATS pipeline with automated CV parsing and Drive archiving."
      actions={
        <button
          type="button"
          className="btn primary"
          onClick={pullGoogleFormBatch}
        >
          <Inbox size={16} /> Poll Google Form Webhook
        </button>
      }
    >
      <div className="chan">
        {/* Careers site upload */}
        <section className="card">
          <h2>
            Careers Site & AI Parser <span className="chip good">Active</span>
          </h2>
          <dl className="kv">
            <dt>Object storage</dt>
            <dd>Cloudflare R2 / S3 (Encrypted)</dd>
            <dt>Parsing engine</dt>
            <dd>Gemini 1.5 Flash / OCR Parser</dd>
            <dt>File formats</dt>
            <dd>PDF and DOCX (up to 5 MB)</dd>
          </dl>
          <ul className="ul">
            <li>Automatic skill extraction and tenure calculation</li>
            <li>Knockout verification against role scorecards</li>
            <li>Duplicate merging based on Nigerian phone numbers & emails</li>
          </ul>
        </section>

        {/* Google Form alternative */}
        <section className="card">
          <h2>
            Google Form Webhook <span className="chip good">Connected</span>
          </h2>
          <dl className="kv">
            <dt>Responses</dt>
            <dd>{googleFormResponsesCount} received via webhook</dd>
            <dt>CV upload</dt>
            <dd>Google Drive folder sync enabled</dd>
            <dt>Automation</dt>
            <dd>Webhook trigger on submission</dd>
          </dl>
          <ul className="ul">
            <li>Instant reference code generation</li>
            <li>Direct ingestion into Screening stage</li>
            <li>Resumes mirrored to employer Google Drive folders</li>
          </ul>
        </section>

        {/* Google Drive resumes */}
        <section className="card">
          <h2>
            Google Drive Service Account{' '}
            <span className={`chip ${driveConnected ? 'good' : 'red'}`}>
              {driveConnected ? 'Synced' : 'Disconnected'}
            </span>
          </h2>
          <dl className="kv">
            <dt>Account</dt>
            <dd className="mono xs">folake@cubetechconsults.com</dd>
            <dt>Folder tree</dt>
            <dd className="mono xs">Cube Tech Recruitment / Client / Role /</dd>
            <dt>Permissions</dt>
            <dd>Scoped strictly to Cube Tech folders</dd>
          </dl>
          <div className="row" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate('drive-sync')}
            >
              Open Drive sync
            </button>
          </div>
        </section>

        {/* Google Sheet log */}
        <section className="card">
          <h2>
            Google Sheet Audit Log{' '}
            <span className={`chip ${sheetLogging ? 'good' : ''}`}>
              {sheetLogging ? 'Live' : 'Paused'}
            </span>
          </h2>
          <dl className="kv">
            <dt>Spreadsheet</dt>
            <dd>Cube Tech Recruitment: Applications</dd>
            <dt>Sync mode</dt>
            <dd>Real-time one-way append</dd>
            <dt>Audit trail</dt>
            <dd>Reference, Candidate, Stage, Drive link</dd>
          </dl>
          <div className="row" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={toggleSheetLogging}
            >
              {sheetLogging ? 'Pause Sheet Sync' : 'Resume Sheet Sync'}
            </button>
          </div>
        </section>

        {/* Termii SMS & WhatsApp Gateway */}
        <section className="card">
          <h2>
            Termii SMS & WhatsApp <span className="chip good">Ready</span>
          </h2>
          <dl className="kv">
            <dt>Provider</dt>
            <dd>Termii Technologies (Nigeria)</dd>
            <dt>Channels</dt>
            <dd>Direct SMS (DND bypass) & WhatsApp</dd>
            <dt>OTP expiration</dt>
            <dd>10 minutes</dd>
          </dl>
          <ul className="ul">
            <li>Instant 6-digit candidate verification OTPs</li>
            <li>Transactional stage alerts to candidates</li>
            <li>Nigerian carrier routing (MTN, Airtel, Glo, 9mobile)</li>
          </ul>
        </section>

        {/* Paystack Invoicing */}
        <section className="card">
          <h2>
            Paystack Naira Invoicing <span className="chip good">Active</span>
          </h2>
          <dl className="kv">
            <dt>Payment gateway</dt>
            <dd>Paystack Nigeria (NGN ₦)</dd>
            <dt>Fee formula</dt>
            <dd className="mono xs">Salary × 12 × Agreed Fee %</dd>
            <dt>Webhooks</dt>
            <dd>Auto-reconciliation on charge.success</dd>
          </dl>
          <div className="row" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => navigate('placements')}
            >
              Manage Placements & Billing
            </button>
          </div>
        </section>
      </div>

      <h3 className="caps" style={{ fontSize: '24px', margin: '14px 0 10px' }}>
        Google Form Links per Open Role
      </h3>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Webhook / Form Link</th>
              <th className="num">Responses</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {publishedRoles.map(j => {
              const responses = applications.filter(
                a => a.jobId === j.id && a.source === 'Google Form'
              ).length;
              return (
                <tr key={j.id}>
                  <td>{j.title}</td>
                  <td className="mono xs">forms.gle/ctc-{j.id}</td>
                  <td className="num">{responses}</td>
                  <td>
                    <span className="chip good">Linked</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="caps" style={{ fontSize: '24px', margin: '22px 0 4px' }}>
        Google Sheet Live Audit Trail
      </h3>
      <p className="muted sm" style={{ marginBottom: '10px' }}>
        Synced rows in the primary Google Sheet. Column links point directly to archived Google Drive resumes.
      </p>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Candidate Name</th>
              <th>Role</th>
              <th>Source</th>
              <th>Current Stage</th>
              <th>Archived CV File</th>
            </tr>
          </thead>
          <tbody>
            {recentApplications.map(app => {
              const cand = candidates.find(c => c.id === app.candId);
              const job = jobs.find(j => j.id === app.jobId);
              return (
                <tr key={app.id}>
                  <td className="mono xs">{app.ref}</td>
                  <td>{cand?.name}</td>
                  <td>{job?.title}</td>
                  <td>{app.source}</td>
                  <td>{STAGE_LABELS[app.stage]}</td>
                  <td className="mono xs">{app.file}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
