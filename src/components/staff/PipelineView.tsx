import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import {
  evaluateCandidate,
  getJobStatus,
  getScoreClass,
  relativeTime,
  STAGES
} from '../../utils/helpers';
import { Stage } from '../../types';
import { KNOCKOUT_QUESTIONS } from '../../data/mockData';

export const PipelineView: React.FC = () => {
  const {
    jobs,
    applications,
    candidates,
    clients,
    pipeJobId,
    setPipeJobId,
    moveApplication,
    openModal
  } = useApp();

  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [activeDragCol, setActiveDragCol] = useState<string | null>(null);

  const activeJobs = jobs.filter(j => j.state !== 'draft');
  const currentJob = jobs.find(j => j.id === pipeJobId) || activeJobs[0] || jobs[0];
  const client = currentJob ? clients.find(c => c.id === currentJob.clientId) : null;

  const jobApps = currentJob
    ? applications.filter(a => a.jobId === currentJob.id)
    : [];

  const rejectedCount = jobApps.filter(a => a.stage === 'rejected').length;

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDragCol !== stageKey) {
      setActiveDragCol(stageKey);
    }
  };

  const handleDragLeave = () => {
    setActiveDragCol(null);
  };

  const handleDrop = (e: React.DragEvent, stageKey: Stage) => {
    e.preventDefault();
    setActiveDragCol(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      moveApplication(appId, stageKey);
    }
    setDraggedAppId(null);
  };

  const handleStageSelect = (appId: string, newStage: string) => {
    if (newStage === 'rejected') {
      openModal({ type: 'reject', id: appId });
      return;
    }
    moveApplication(appId, newStage as Stage);
  };

  return (
    <StaffShell
      title="Pipeline"
      sub={`${jobApps.length} applications · listing ${
        currentJob ? getJobStatus(currentJob).toLowerCase() : ''
      } · ${client?.name || ''}`}
      actions={
        <div>
          <label className="sr" htmlFor="pipe-select">
            Select job order
          </label>
          <select
            id="pipe-select"
            value={currentJob?.id}
            onChange={e => setPipeJobId(e.target.value)}
            style={{ minWidth: '240px' }}
          >
            {activeJobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="board" role="group" aria-label="Pipeline board">
        {STAGES.map(([stageKey, stageLabel]) => {
          const columnApps = jobApps.filter(a => a.stage === stageKey);
          const isOver = activeDragCol === stageKey;

          return (
            <div
              key={stageKey}
              className={`col ${isOver ? 'over' : ''}`}
              onDragOver={e => handleDragOver(e, stageKey)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stageKey)}
              aria-label={stageLabel}
            >
              <h3>
                {stageLabel}
                <span>{columnApps.length}</span>
              </h3>

              {columnApps.length > 0 ? (
                columnApps.map(app => {
                  const candidate = candidates.find(c => c.id === app.candId);
                  if (!candidate) return null;

                  const evaluation = currentJob
                    ? evaluateCandidate(currentJob, candidate, app.answers, KNOCKOUT_QUESTIONS)
                    : { score: 70, crit: [], ko: true, must: 2 };

                  const scoreClass = getScoreClass(evaluation.score);

                  return (
                    <div
                      key={app.id}
                      className={`kcard ${app.rejectPending ? 'pending' : ''}`}
                      draggable
                      onDragStart={e => handleDragStart(e, app.id)}
                    >
                      <button
                        type="button"
                        className="kname"
                        onClick={() => openModal({ type: 'app', id: app.id })}
                      >
                        {candidate.name}
                      </button>

                      <div className="muted xs">
                        {candidate.headline} · {candidate.loc}
                      </div>

                      <div className="row spread" style={{ marginTop: '6px' }}>
                        <span className={`score ${scoreClass}`}>
                          {evaluation.score} match
                        </span>

                        {app.rejectPending ? (
                          <span className="chip red">Not progressing?</span>
                        ) : (
                          <span className="xs muted">{relativeTime(app.updated)}</span>
                        )}
                      </div>

                      <label className="sr" htmlFor={`mv-${app.id}`}>
                        Move {candidate.name} to stage
                      </label>
                      <select
                        id={`mv-${app.id}`}
                        value={app.stage}
                        onChange={e => handleStageSelect(app.id, e.target.value)}
                      >
                        {STAGES.map(([stKey, stLabel]) => (
                          <option key={stKey} value={stKey}>
                            {stLabel}
                          </option>
                        ))}
                        <option value="rejected">Not progressed</option>
                      </select>
                    </div>
                  );
                })
              ) : (
                <p className="xs muted" style={{ padding: '6px 4px' }}>
                  Drop a card here
                </p>
              )}
            </div>
          );
        })}
      </div>

      {rejectedCount > 0 && (
        <p className="muted sm" style={{ marginTop: '12px' }}>
          {rejectedCount} not progressed on this role.
        </p>
      )}

      <p className="hint" style={{ marginTop: '6px' }}>
        Drag cards between columns, or use the menu on a card. Moving a card updates
        the status the applicant sees in real time.
      </p>
    </StaffShell>
  );
};
