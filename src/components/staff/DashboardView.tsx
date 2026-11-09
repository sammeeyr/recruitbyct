import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import {
  addDays,
  DAY_MS,
  daysDiff,
  formatDate,
  formatNaira,
  relativeTime,
  STAGES
} from '../../utils/helpers';
import { Plus } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    jobs,
    applications,
    placements,
    clients,
    activityLogs,
    approvals,
    openModal,
    moveApplication,
    openReplacementSearch
  } = useApp();

  const openJobsCount = jobs.filter(j => j.state === 'open').length;

  const applicationsThisWeek = applications.filter(
    a => Date.now() - new Date(a.applied).getTime() < 7 * DAY_MS
  ).length;

  const waitingForReview = applications.filter(
    a => a.stage === 'new' || a.stage === 'screening'
  ).length;

  const totalFeesBooked = placements.reduce((sum, p) => {
    const cl = clients.find(c => c.id === p.clientId);
    const feeRate = cl ? cl.fee : 15;
    return sum + (p.salary * 12 * feeRate) / 100;
  }, 0);

  const activeApps = applications.filter(
    a => !['rejected', 'withdrawn'].includes(a.stage)
  );

  const stageCounts = STAGES.map(([stageKey, stageLabel]) => {
    const count = activeApps.filter(a => a.stage === stageKey).length;
    return { key: stageKey, label: stageLabel, count };
  });

  const maxStageCount = Math.max(1, ...stageCounts.map(s => s.count));

  // Guarantee watch: Placed candidates who left early or are within 14 days of guarantee ending
  const guaranteeWatchList = placements.filter(p => {
    if (p.status === 'left') return true;
    const daysSinceStart = -daysDiff(p.start);
    const daysRemaining = p.guarantee - daysSinceStart;
    return p.status === 'active' && daysRemaining >= 0 && daysRemaining <= 14;
  });

  const handleApprovalAction = (act: string, id: string) => {
    if (act === 'openJo') {
      openModal({ type: 'jo', id });
    } else if (act === 'reviewReject') {
      openModal({ type: 'reject', id });
    } else if (act === 'confirmShort') {
      moveApplication(id, 'shortlisted');
    }
  };

  return (
    <StaffShell
      title="Dashboard"
      sub="Clear approvals first, then move candidates forward."
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
      {/* KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span>Open job orders</span>
          <b>{openJobsCount}</b>
        </div>
        <div className="kpi">
          <span>Applications this week</span>
          <b>{applicationsThisWeek}</b>
        </div>
        <div className="kpi">
          <span>Waiting for review</span>
          <b>{waitingForReview}</b>
        </div>
        <div className="kpi">
          <span>Placements</span>
          <b>{placements.length}</b>
        </div>
        <div className="kpi">
          <span>Fees booked</span>
          <b>{formatNaira(totalFeesBooked / 1000)}k</b>
        </div>
      </div>

      {/* Main Action Columns */}
      <div className="cols">
        {/* Needs your approval */}
        <section className="card attn">
          <h2>Needs your approval</h2>
          {approvals.length ? (
            <ul className="list">
              {approvals.map(item => (
                <li key={item.id}>
                  <div className="t">
                    <b>{item.title}</b>
                    <span className="muted sm">{item.sub}</span>
                  </div>
                  <button
                    type="button"
                    className={`btn ${
                      item.act === 'confirmShort' ? 'primary' : 'dark'
                    } sm`}
                    onClick={() => handleApprovalAction(item.act, item.id)}
                  >
                    {item.btn}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Nothing is waiting. Every decision has a human recruiter behind it.
            </p>
          )}
        </section>

        {/* Applications by stage */}
        <section className="card">
          <h2>Applications by stage</h2>
          <div className="bars">
            {stageCounts.map(st => {
              const widthPct = Math.round((st.count / maxStageCount) * 100);
              return (
                <div key={st.key} className="bar">
                  <span>{st.label}</span>
                  <i>
                    <u style={{ width: `${widthPct}%` }} />
                  </i>
                  <b>{st.count}</b>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Secondary Columns: Activity Feed & Guarantee Watch */}
      <div className="cols">
        {/* Recent activity */}
        <section className="card">
          <h2>Recent activity</h2>
          <ul className="list feed">
            {activityLogs.slice(0, 7).map((log, idx) => (
              <li key={idx}>
                {log.m}
                <time>{relativeTime(log.t)}</time>
              </li>
            ))}
          </ul>
        </section>

        {/* Guarantee watch */}
        <section className="card">
          <h2>Guarantee watch</h2>
          {guaranteeWatchList.length ? (
            <ul className="list">
              {guaranteeWatchList.map(p => {
                const client = clients.find(c => c.id === p.clientId);
                if (p.status === 'left') {
                  return (
                    <li key={p.id}>
                      <div className="t">
                        <b>
                          {p.name} left after {p.leftDay} days
                        </b>
                        <span className="muted sm">
                          {p.title} · {client?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn dark sm"
                        onClick={() => openReplacementSearch(p.id)}
                      >
                        Open replacement search
                      </button>
                    </li>
                  );
                }

                const daysUsed = -daysDiff(p.start);
                const daysRemaining = p.guarantee - daysUsed;
                return (
                  <li key={p.id}>
                    <div className="t">
                      <b>{p.name}</b>
                      <span className="muted sm">
                        Guarantee ends {formatDate(addDays(daysRemaining))}
                      </span>
                    </div>
                    <span className="chip warn">Ending soon</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No placements currently requiring guarantee attention.</p>
          )}
        </section>
      </div>
    </StaffShell>
  );
};
