import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { relativeTime } from '../../utils/helpers';

export const DriveSyncView: React.FC = () => {
  const { driveConnected, driveLogs, toggleDrive, retryDriveSync, showToast } = useApp();

  const queuedCount = driveLogs.filter(d => d.status === 'Queued').length;

  return (
    <StaffShell
      title="Drive sync"
      sub="Your master copies stay in Cube Tech secure storage. This Drive holds a synced copy for team reference and client sharing."
      actions={
        driveConnected ? (
          <button type="button" className="btn ghost" onClick={toggleDrive}>
            Disconnect Drive
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={toggleDrive}>
            Reconnect Google Drive
          </button>
        )
      }
    >
      {!driveConnected && (
        <div className="banner red" style={{ marginBottom: '14px' }}>
          <b>Drive is disconnected.</b> New CVs are safely saved to Cube Tech storage and
          queued here until you reconnect. Nothing is lost.
        </div>
      )}

      <div className="cols">
        <section className="card">
          <h2>Connection</h2>
          <dl className="kv">
            <dt>Account</dt>
            <dd>folake@cubetechconsults.com</dd>
            <dt>Status</dt>
            <dd>
              <span className={`chip ${driveConnected ? 'good' : 'red'}`}>
                {driveConnected ? 'Connected' : 'Disconnected'}
              </span>
            </dd>
            <dt>Access</dt>
            <dd>Only the folder Cube Tech Consults created. Never your personal Drive.</dd>
            <dt>Queued files</dt>
            <dd>{queuedCount}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Folder structure</h2>
          <div className="tree">
{`Cube Tech Recruitment/
├─ Nexus Microfinance Bank/
│  └─ Customer Success Lead/
│     └─ Ifeoma_Chukwu_2026-11-02.pdf
├─ Savanna Logistics/
├─ Talent Pool/
│  └─ 2026-11/
└─ Inbox/  (watched, phase two)`}
          </div>
        </section>
      </div>

      <h3 className="caps" style={{ fontSize: '24px', margin: '14px 0 10px' }}>
        Sync log
      </h3>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Candidate</th>
              <th>Source</th>
              <th>Processed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {driveLogs.map(log => {
              const chipClass =
                log.status === 'Synced'
                  ? 'good'
                  : log.status === 'Duplicate'
                  ? ''
                  : log.status === 'Queued'
                  ? 'warn'
                  : 'red';

              return (
                <tr key={log.id}>
                  <td>
                    <span className="mono xs">{log.file}</span>
                  </td>
                  <td>{log.cand}</td>
                  <td>{log.source}</td>
                  <td>{relativeTime(log.at)}</td>
                  <td>
                    <span className={`chip ${chipClass}`}>{log.status}</span>
                  </td>
                  <td>
                    {log.status === 'Queued' ? (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => retryDriveSync(log.id)}
                        disabled={!driveConnected}
                      >
                        Retry
                      </button>
                    ) : log.status === 'Needs review' ? (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() =>
                          showToast(
                            'The file review tool opens here in the live production system.'
                          )
                        }
                      >
                        Review
                      </button>
                    ) : log.status === 'Duplicate' ? (
                      <span className="muted xs">Merged into profile</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
