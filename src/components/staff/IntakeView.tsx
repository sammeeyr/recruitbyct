import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { STAGE_LABELS } from '../../utils/helpers';
import { Inbox } from 'lucide-react';

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
      title="Intake"
      sub="Every application, from any channel, lands in the same pipeline, with the CV saved to Drive."
      actions={
        <button
          type="button"
          className="btn primary"
          onClick={pullGoogleFormBatch}
        >
          <Inbox size={16} /> Check for new Form responses
        </button>
      }
    >
      <div className="chan">
        {/* Careers site upload */}
        <section className="card">
          <h2>
            Careers site upload <span className="chip good">On</span>
          </h2>
          <dl className="kv">
            <dt>Accepted</dt>
            <dd>PDF and DOCX only</dd>
            <dt>Size limit</dt>
            <dd>5 MB</dd>
          </dl>
          <ul className="ul">
            <li>Checked by extension and file type, not just the file name</li>
            <li>Old .doc, images, zips and empty files are refused with a clear message</li>
            <li>Password-protected files go to Needs review</li>
            <li>Duplicates merge into the existing profile by email or phone</li>
          </ul>
        </section>

        {/* Google Form alternative */}
        <section className="card">
          <h2>
            Google Form alternative <span className="chip good">On</span>
          </h2>
          <dl className="kv">
            <dt>Form responses</dt>
            <dd>{googleFormResponsesCount} received so far</dd>
            <dt>CV upload</dt>
            <dd>Google sign-in required. PDF and DOCX only, set in the form.</dd>
            <dt>Pickup</dt>
            <dd>Every 5 minutes, or when you press the button</dd>
          </dl>
          <ul className="ul">
            <li>Each response becomes an application with a reference number</li>
            <li>The applicant is emailed the reference and can track it as normal</li>
            <li>Uploaded files are moved into the recruitment Drive folder</li>
          </ul>
        </section>

        {/* Google Drive resumes */}
        <section className="card">
          <h2>
            Google Drive resumes{' '}
            <span className={`chip ${driveConnected ? 'good' : 'red'}`}>
              {driveConnected ? 'Connected' : 'Disconnected'}
            </span>
          </h2>
          <dl className="kv">
            <dt>Folder</dt>
            <dd className="mono xs">Cube Tech Recruitment / client / role /</dd>
            <dt>File name</dt>
            <dd className="mono xs">Name_Role_Date.pdf</dd>
            <dt>Master copy</dt>
            <dd>Also stored in Cube Tech Cloud storage</dd>
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
            Google Sheet log{' '}
            <span className={`chip ${sheetLogging ? 'good' : ''}`}>
              {sheetLogging ? 'On' : 'Paused'}
            </span>
          </h2>
          <dl className="kv">
            <dt>Sheet</dt>
            <dd>Cube Tech Recruitment: Applications</dd>
            <dt>Adds a row</dt>
            <dd>For every new incoming application</dd>
            <dt>Direction</dt>
            <dd>One way. Edits in the Sheet do not alter the pipeline.</dd>
          </dl>
          <div className="row" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={toggleSheetLogging}
            >
              {sheetLogging ? 'Pause logging' : 'Turn logging on'}
            </button>
          </div>
        </section>
      </div>

      <h3 className="caps" style={{ fontSize: '24px', margin: '14px 0 10px' }}>
        Google Form per role
      </h3>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Form link</th>
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
        Sheet preview
      </h3>
      <p className="muted sm" style={{ marginBottom: '10px' }}>
        The latest rows the log sheet holds. The link in the last column points at the Drive copy.
      </p>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Name</th>
              <th>Role</th>
              <th>Source</th>
              <th>Stage</th>
              <th>CV file</th>
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
